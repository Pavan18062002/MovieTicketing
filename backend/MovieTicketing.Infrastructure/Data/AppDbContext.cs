using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using MovieTicketing.Application.Interfaces;
using MovieTicketing.Domain.Entities;
public class AppDbContext
    : IdentityDbContext<ApplicationUser, IdentityRole, string,
        IdentityUserClaim<string>,
        IdentityUserRole<string>,
        IdentityUserLogin<string>,
        IdentityRoleClaim<string>,
        IdentityUserToken<string>>, IAppDbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Movie> Movies { get; set; }
    public DbSet<Screen> Screens { get; set; }
    public DbSet<Seat> Seats { get; set; }
    public DbSet<Show> Shows { get; set; }
    public DbSet<Booking> Bookings { get; set; }
    public DbSet<BookingSeat> BookingSeats { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Rename the 3 tables we KEEP to clean names
        builder.Entity<ApplicationUser>().ToTable("Users");
        builder.Entity<IdentityRole>().ToTable("Roles");
        builder.Entity<IdentityUserRole<string>>().ToTable("UserRoles");

        // REMOVE the 4 tables we don't need (no OAuth, no 2FA)
        builder.Ignore<IdentityUserClaim<string>>();
        builder.Ignore<IdentityUserLogin<string>>();
        builder.Ignore<IdentityUserToken<string>>();
        builder.Ignore<IdentityRoleClaim<string>>();

        // ── Movie ──────────────────────────────────────────────────────────
        builder.Entity<Movie>(e =>
        {
            e.Property(m => m.Title).HasMaxLength(200).IsRequired();
            e.Property(m => m.Genre).HasMaxLength(100);
            e.Property(m => m.PosterUrl).HasMaxLength(500);
            e.HasIndex(m => m.Title);
        });

        // ── Screen ─────────────────────────────────────────────────────────
        builder.Entity<Screen>(e =>
        {
            e.Property(s => s.Name).HasMaxLength(100).IsRequired();
        });

        // ── Seat ───────────────────────────────────────────────────────────
        builder.Entity<Seat>(e =>
        {
            e.Property(s => s.SeatNumber).HasMaxLength(10).IsRequired();
            // Enforce unique seat labels per screen
            e.HasIndex(s => new { s.ScreenId, s.SeatNumber }).IsUnique();
        });

        // ── Show ───────────────────────────────────────────────────────────
        builder.Entity<Show>(e =>
        {
            e.Property(s => s.BaseTicketPrice).HasColumnType("decimal(18,2)");
            e.HasIndex(s => new { s.ScreenId, s.ShowTime });
        });

        // ── Booking ────────────────────────────────────────────────────────
        builder.Entity<Booking>(e =>
        {
            e.Property(b => b.TotalAmount).HasColumnType("decimal(18,2)");
            e.Property(b => b.BookingReference).HasMaxLength(20).IsRequired();
            e.HasIndex(b => b.BookingReference).IsUnique();
        });

        // ── BookingSeat ────────────────────────────────────────────────────
        builder.Entity<BookingSeat>(e =>
        {
            e.Property(bs => bs.Price).HasColumnType("decimal(18,2)");

            // PRIMARY double-booking guard at DB level.
            // A seat can only be booked once per show.
            e.HasIndex(bs => new { bs.ShowId, bs.SeatId }).IsUnique();
        });
    }
}
