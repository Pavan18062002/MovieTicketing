namespace MovieTicketing.Application.Interfaces;

public interface IRedisCacheService
{
    // Generic cache helpers
    Task<T?> GetAsync<T>(string key);
    Task SetAsync<T>(string key, T value, TimeSpan expiration);
    Task RemoveAsync(string key);
    Task RemoveByPrefixAsync(string prefix);

    // Seat locking
    Task<bool> AcquireSeatLockAsync(int showId, int seatId, string userId, TimeSpan ttl);
    Task<string?> GetSeatLockOwnerAsync(int showId, int seatId);
    Task ReleaseSeatLockAsync(int showId, int seatId);
}
