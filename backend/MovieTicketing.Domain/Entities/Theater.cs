using System;
using System.Collections.Generic;

namespace MovieTicketing.Domain.Entities;

/// <summary>
/// Represents a cinema multiplex / theater facility owned by a specific Admin.
/// </summary>
public class Theater
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;

    // Ownership: The Admin user who owns and manages this theater
    public string AdminId { get; set; } = string.Empty;
    public virtual ApplicationUser? Admin { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation: A theater contains one or more screening auditoriums
    public virtual ICollection<Screen> Screens { get; set; } = new List<Screen>();
}
