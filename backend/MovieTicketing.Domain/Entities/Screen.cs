using System;
using System.Collections.Generic;

namespace MovieTicketing.Domain.Entities;

public class Screen
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Capacity { get; set; }
    public int TotalRows { get; set; }
    public int TotalColumns { get; set; }
    public int PremiumRows { get; set; } = 5;
    public int VipRows { get; set; } = 2;
    public decimal PremiumMultiplier { get; set; } = 1.3m;
    public decimal VipMultiplier { get; set; } = 1.6m;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public virtual ICollection<Seat> Seats { get; set; } = new List<Seat>();
    public virtual ICollection<Show> Shows { get; set; } = new List<Show>();
}
