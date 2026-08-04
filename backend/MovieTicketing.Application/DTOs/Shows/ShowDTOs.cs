using System.ComponentModel.DataAnnotations;

namespace MovieTicketing.Application.DTOs.Shows;

public class CreateShowDto
{
    [Required]
    public int MovieId { get; set; }

    [Required]
    public int ScreenId { get; set; }

    [Required]
    public DateTime ShowTime { get; set; }

    [Required, Range(0.01, 1000.00)]
    public decimal BaseTicketPrice { get; set; }
}

public class UpdateShowDto
{
    [Required]
    public DateTime ShowTime { get; set; }

    [Required, Range(0.01, 1000.00)]
    public decimal BaseTicketPrice { get; set; }

    public bool IsActive { get; set; } = true;
}

public class ShowResponseDto
{
    public int Id { get; set; }
    public int MovieId { get; set; }
    public string MovieTitle { get; set; } = string.Empty;
    public string PosterUrl { get; set; } = string.Empty;
    public string Genre { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int DurationMinutes { get; set; }
    public int ScreenId { get; set; }
    public string ScreenName { get; set; } = string.Empty;
    public DateTime ShowTime { get; set; }
    public decimal BaseTicketPrice { get; set; }
    public bool IsActive { get; set; }
    public int TotalSeats { get; set; }
    public int BookedSeats { get; set; }
    public int AvailableSeats { get; set; }
}
