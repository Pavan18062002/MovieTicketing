using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using MovieTicketing.Application.Interfaces;
using MovieTicketing.Infrastructure.Hubs;

namespace MovieTicketing.Infrastructure.Services;

public class RealTimeNotificationService : IRealTimeNotificationService
{
    private readonly IHubContext<ShowHub> _showHub;
    private readonly IHubContext<AdminHub> _adminHub;

    public RealTimeNotificationService(IHubContext<ShowHub> showHub, IHubContext<AdminHub> adminHub)
    {
        _showHub = showHub;
        _adminHub = adminHub;
    }

    // Broadcast when seats are temporarily locked in Redis
    public async Task SendSeatLockedAsync(int showId, List<int> seatIds, string lockedByUserId)
    {
        var group = ShowHub.GetGroupName(showId);
        await _showHub.Clients.Group(group).SendAsync("SeatsLocked", new
        {
            ShowId = showId,
            SeatIds = seatIds,
            LockedByUserId = lockedByUserId
        });
    }

    // Broadcast when user deselects seats or lock timer expires
    public async Task SendSeatUnlockedAsync(int showId, List<int> seatIds)
    {
        var group = ShowHub.GetGroupName(showId);
        await _showHub.Clients.Group(group).SendAsync("SeatsUnlocked", new
        {
            ShowId = showId,
            SeatIds = seatIds
        });
    }

    // Broadcast when seats are permanently purchased and saved in DB
    public async Task SendSeatBookedAsync(int showId, List<int> seatIds)
    {
        var group = ShowHub.GetGroupName(showId);
        await _showHub.Clients.Group(group).SendAsync("SeatsBooked", new
        {
            ShowId = showId,
            SeatIds = seatIds
        });
    }

    // Push low stock notification to all connected admins
    public async Task SendLowStockAlertAsync(int concessionItemId, string itemName, string itemSize, int currentStock, int baseStock)
    {
        await _adminHub.Clients.Group(AdminHub.AdminGroupName).SendAsync("LowStockAlert", new
        {
            ConcessionItemId = concessionItemId,
            ItemName = itemName,
            ItemSize = itemSize,
            CurrentStock = currentStock,
            BaseStock = baseStock,
            Timestamp = DateTime.UtcNow
        });
    }
}
