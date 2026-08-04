using System.ComponentModel.DataAnnotations;

namespace MovieTicketing.Application.DTOs.Movies;

public class CreateMovieDto
{
    [Required, MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required, MaxLength(2000)]
    public string Description { get; set; } = string.Empty;

    [Range(1, 600, ErrorMessage = "Duration must be between 1 and 600 minutes.")]
    public int DurationMinutes { get; set; }

    [MaxLength(500)]
    public string? PosterUrl { get; set; }

    [Required]
    public string Genre { get; set; } = string.Empty;
}

public class UpdateMovieDto
{
    [MaxLength(200)]
    public string? Title { get; set; }

    [MaxLength(2000)]
    public string? Description { get; set; }

    [Range(1, 600)]
    public int? DurationMinutes { get; set; }

    [MaxLength(500)]
    public string? PosterUrl { get; set; }

    public string? Genre { get; set; }

    public bool? IsActive { get; set; }
}

public class MovieResponseDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int DurationMinutes { get; set; }
    public string? PosterUrl { get; set; }
    public string Genre { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public int ShowCount { get; set; }
}
