using System;
using System.Collections.Generic;

namespace MovieTicketing.Application.DTOs.Bookings;

public class TicketProcessingMessage
{
    public int BookingId { get; set; }
    public string BookingReference { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string UserEmail { get; set; } = string.Empty;
    public string UserFullName { get; set; } = string.Empty;
    public string MovieTitle { get; set; } = string.Empty;
    public string ScreenName { get; set; } = string.Empty;
    public DateTime ShowTime { get; set; }
    public List<string> SeatNumbers { get; set; } = new();
    public decimal TotalAmount { get; set; }
    public DateTime BookedAt { get; set; }
}
