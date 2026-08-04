using System.ComponentModel.DataAnnotations;
using MovieTicketing.Domain.Enums;

namespace MovieTicketing.Application.DTOs.Bookings;

public class SeatInfoDto
{
    public int Id { get; set; }
    public string SeatNumber { get; set; } = string.Empty;
    public SeatType SeatType { get; set; }
    public string SeatTypeName { get; set; } = string.Empty;
    public int Row { get; set; }
    public int Column { get; set; }
    public decimal Price { get; set; }
    public bool IsBooked { get; set; }
}

public class ShowSeatsResponseDto
{
    public int ShowId { get; set; }
    public string MovieTitle { get; set; } = string.Empty;
    public string ScreenName { get; set; } = string.Empty;
    public DateTime ShowTime { get; set; }
    public decimal BaseTicketPrice { get; set; }
    public int TotalRows { get; set; }
    public int TotalColumns { get; set; }
    public List<SeatInfoDto> Seats { get; set; } = new();
}

public class CheckoutConcessionItemDto
{
    [Required]
    public int ConcessionItemId { get; set; }

    [Required, Range(1, 20)]
    public int Quantity { get; set; }
}

public class CheckoutRequestDto
{
    [Required]
    public int ShowId { get; set; }

    [Required, MinLength(1, ErrorMessage = "At least one seat must be selected.")]
    public List<int> SeatIds { get; set; } = new();

    public List<CheckoutConcessionItemDto> ConcessionItems { get; set; } = new();
}

public class BookingSeatResponseDto
{
    public int SeatId { get; set; }
    public string SeatNumber { get; set; } = string.Empty;
    public SeatType SeatType { get; set; }
    public string SeatTypeName { get; set; } = string.Empty;
    public int Row { get; set; }
    public int Column { get; set; }
    public decimal Price { get; set; }
}

public class BookingConcessionResponseDto
{
    public int ConcessionItemId { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public string ItemSize { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal Subtotal { get; set; }
}

public class BookingResponseDto
{
    public int Id { get; set; }
    public string BookingReference { get; set; } = string.Empty;
    public int ShowId { get; set; }
    public string MovieTitle { get; set; } = string.Empty;
    public string PosterUrl { get; set; } = string.Empty;
    public string ScreenName { get; set; } = string.Empty;
    public DateTime ShowTime { get; set; }
    public List<BookingSeatResponseDto> Seats { get; set; } = new();
    public List<BookingConcessionResponseDto> Concessions { get; set; } = new();
    public decimal TicketsTotal { get; set; }
    public decimal ConcessionsTotal { get; set; }
    public decimal TotalAmount { get; set; }
    public BookingStatus Status { get; set; }
    public string StatusName { get; set; } = string.Empty;
    public DateTime BookedAt { get; set; }
}
