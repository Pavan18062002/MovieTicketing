using System.ComponentModel.DataAnnotations;

namespace MovieTicketing.Application.DTOs.Screens;

public class CreateScreenDto
{
    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Range(1, 100, ErrorMessage = "Total rows must be between 1 and 100.")]
    public int TotalRows { get; set; }

    [Range(1, 100, ErrorMessage = "Total columns must be between 1 and 100.")]
    public int TotalColumns { get; set; }

    [Range(0, 100, ErrorMessage = "Premium rows must be between 0 and 100.")]
    public int PremiumRows { get; set; } = 5;

    [Range(0, 100, ErrorMessage = "VIP rows must be between 0 and 100.")]
    public int VipRows { get; set; } = 2;

    [Range(1.0, 5.0, ErrorMessage = "Premium multiplier must be between 1.0 and 5.0.")]
    public decimal PremiumMultiplier { get; set; } = 1.3m;

    [Range(1.0, 5.0, ErrorMessage = "VIP multiplier must be between 1.0 and 5.0.")]
    public decimal VipMultiplier { get; set; } = 1.6m;
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
    public int PremiumRows { get; set; }
    public int VipRows { get; set; }
    public decimal PremiumMultiplier { get; set; }
    public decimal VipMultiplier { get; set; }
}
