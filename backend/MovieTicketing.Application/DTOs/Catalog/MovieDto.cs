using System;
using System.ComponentModel.DataAnnotations;

namespace MovieTicketing.Application.DTOs.Catalog;

public class MovieDto
{
    public Guid Id { get; set; }

    [Required(ErrorMessage = "Movie title is required.")]
    [StringLength(200, MinimumLength = 1, ErrorMessage = "Title must be between 1 and 200 characters.")]
    public string Title { get; set; } = string.Empty;

    [Required(ErrorMessage = "Movie description is required.")]
    [StringLength(2000, ErrorMessage = "Description cannot exceed 2000 characters.")]
    public string Description { get; set; } = string.Empty;

    [Required(ErrorMessage = "Duration in minutes is required.")]
    [Range(1, 1000, ErrorMessage = "Duration must be between 1 and 1000 minutes.")]
    public int DurationInMinutes { get; set; }
    public string PosterUrl { get; set; } = string.Empty;

    [Required(ErrorMessage = "Genre is required.")]
    [StringLength(50, ErrorMessage = "Genre cannot exceed 50 characters.")]
    public string Genre { get; set; } = string.Empty;

    [Required(ErrorMessage = "Release date is required.")]
    public DateTime ReleaseDate { get; set; }
}
