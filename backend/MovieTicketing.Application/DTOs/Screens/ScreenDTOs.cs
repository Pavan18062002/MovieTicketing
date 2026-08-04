using System.ComponentModel.DataAnnotations;

namespace MovieTicketing.Application.DTOs.Screens;

public class CreateScreenDto
{
    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Range(1, 26, ErrorMessage = "Total rows must be between 1 and 26 (A-Z).")]
    public int TotalRows { get; set; }

    [Range(1, 30, ErrorMessage = "Total columns must be between 1 and 30.")]
    public int TotalColumns { get; set; }
}

public class UpdateScreenDto
{
    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;
}

public class ScreenResponseDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Capacity { get; set; }
    public int TotalRows { get; set; }
    public int TotalColumns { get; set; }
}
