using System.Collections.Concurrent;
using System.Text.Json;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using MovieTicketing.Application.Interfaces;
using StackExchange.Redis;

namespace MovieTicketing.Infrastructure.Services;

public class RedisCacheService : IRedisCacheService
{
    private readonly IDistributedCache _cache;
    private readonly IConnectionMultiplexer? _redis;
    private readonly ILogger<RedisCacheService> _logger;

    // Fallback thread-safe in-memory lock store when Redis server is offline locally
    private static readonly ConcurrentDictionary<string, (string UserId, DateTime ExpiresAt)> InMemoryLocks = new();

    public RedisCacheService(
        IDistributedCache cache,
        ILogger<RedisCacheService> logger,
        IServiceProvider serviceProvider)
    {
        _cache = cache;
        _logger = logger;
        _redis = serviceProvider.GetService<IConnectionMultiplexer>();
    }

    public async Task<T?> GetAsync<T>(string key)
    {
        if (_redis == null || !_redis.IsConnected) return default;

        try
        {
            var bytes = await _cache.GetAsync(key);
            if (bytes == null || bytes.Length == 0) return default;
            return JsonSerializer.Deserialize<T>(bytes);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Redis GET failed for key {Key}", key);
            return default;
        }
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan expiration)
    {
        if (_redis == null || !_redis.IsConnected) return;

        try
        {
            var bytes = JsonSerializer.SerializeToUtf8Bytes(value);
            var options = new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = expiration
            };
            await _cache.SetAsync(key, bytes, options);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Redis SET failed for key {Key}", key);
        }
    }

    public async Task RemoveAsync(string key)
    {
        if (_redis == null || !_redis.IsConnected) return;

        try
        {
            await _cache.RemoveAsync(key);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Redis REMOVE failed for key {Key}", key);
        }
    }

    public async Task RemoveByPrefixAsync(string prefix)
    {
        if (_redis == null || !_redis.IsConnected) return;

        try
        {
            var db = _redis.GetDatabase();
            var server = _redis.GetServers().FirstOrDefault();
            if (server == null) return;

            var keys = server.Keys(pattern: $"{prefix}*").ToArray();
            if (keys.Length > 0)
                await db.KeyDeleteAsync(keys);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Redis prefix delete failed for prefix {Prefix}", prefix);
        }
    }

    // Atomic lock acquisition: Redis SET NX EX when online, ConcurrentDictionary fallback when offline
    public async Task<bool> AcquireSeatLockAsync(int showId, int seatId, string userId, TimeSpan ttl)
    {
        var key = SeatLockKey(showId, seatId);

        if (_redis != null && _redis.IsConnected)
        {
            try
            {
                var db = _redis.GetDatabase();
                return await db.StringSetAsync(key, userId, ttl, When.NotExists);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Redis lock acquire failed for show {ShowId} seat {SeatId}", showId, seatId);
            }
        }

        // Clean, strict in-memory lock check (thread-safe)
        var now = DateTime.UtcNow;
        var expiresAt = now.Add(ttl);

        if (InMemoryLocks.TryGetValue(key, out var existing))
        {
            if (existing.ExpiresAt > now)
            {
                // Lock held by the same user -> refresh lock
                if (existing.UserId == userId)
                {
                    InMemoryLocks[key] = (userId, expiresAt);
                    return true;
                }
                // Lock held by a different user -> return conflict
                return false;
            }
        }


        InMemoryLocks[key] = (userId, expiresAt);
        return true;
    }

    public async Task<string?> GetSeatLockOwnerAsync(int showId, int seatId)
    {
        var key = SeatLockKey(showId, seatId);

        if (_redis != null && _redis.IsConnected)
        {
            try
            {
                var db = _redis.GetDatabase();
                var value = await db.StringGetAsync(key);
                return value.HasValue ? value.ToString() : null;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Redis seat lock owner check failed for show {ShowId} seat {SeatId}", showId, seatId);
            }
        }

        if (InMemoryLocks.TryGetValue(key, out var existing))
        {
            if (existing.ExpiresAt > DateTime.UtcNow)
                return existing.UserId;

            InMemoryLocks.TryRemove(key, out _);
        }

        return null;
    }

    public async Task ReleaseSeatLockAsync(int showId, int seatId)
    {
        var key = SeatLockKey(showId, seatId);

        if (_redis != null && _redis.IsConnected)
        {
            try
            {
                var db = _redis.GetDatabase();
                await db.KeyDeleteAsync(key);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Redis seat lock release failed for show {ShowId} seat {SeatId}", showId, seatId);
            }
        }

        InMemoryLocks.TryRemove(key, out _);
    }

    private static string SeatLockKey(int showId, int seatId)
        => $"lock:show:{showId}:seat:{seatId}";
}
