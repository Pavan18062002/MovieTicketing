using System;

namespace MovieTicketing.Application.DTOs.Theaters;

public class CreateTheaterDto
{
    public string Name { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
}

public class UpdateTheaterDto
{
    public string Name { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
}

public class TheaterResponseDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string AdminId { get; set; } = string.Empty;
    public string AdminName { get; set; } = string.Empty;
    public int ScreenCount { get; set; }
    public DateTime CreatedAt { get; set; }
}
