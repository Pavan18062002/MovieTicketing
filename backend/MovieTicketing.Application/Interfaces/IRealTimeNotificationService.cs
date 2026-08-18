using System.Collections.Generic;
using System.Threading.Tasks;

namespace MovieTicketing.Application.Interfaces;

public interface IRealTimeNotificationService
{
    Task SendSeatLockedAsync(int showId, List<int> seatIds, string lockedByUserId);
    Task SendSeatUnlockedAsync(int showId, List<int> seatIds);
    Task SendSeatBookedAsync(int showId, List<int> seatIds);
    Task SendLowStockAlertAsync(int concessionItemId, string itemName, string itemSize, int currentStock, int baseStock);
}
