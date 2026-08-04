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
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public virtual ICollection<Seat> Seats { get; set; } = new List<Seat>();
    public virtual ICollection<Show> Shows { get; set; } = new List<Show>();
}
