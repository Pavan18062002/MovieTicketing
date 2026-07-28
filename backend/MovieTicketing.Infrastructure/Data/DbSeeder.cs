using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using MovieTicketing.Domain.Entities;

namespace MovieTicketing.Infrastructure.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(
        AppDbContext context,
        UserManager<ApplicationUser> userManager,
        RoleManager<IdentityRole> roleManager)
    {
        // 1. Apply pending migrations automatically on startup
        await context.Database.MigrateAsync();

        // 2. Seed Roles
        string[] roles = { "Admin", "EndUser" };
        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(new IdentityRole(role));
            }
        }

        // 3. Seed Default Admin
        const string adminEmail = "pavanadmin@cinebook.com";
        if (await userManager.FindByEmailAsync(adminEmail) == null)
        {
            var admin = new ApplicationUser
            {
                UserName = adminEmail,
                Email = adminEmail,
                FullName = "System Admin",
                EmailConfirmed = true,
                CreatedAt = DateTime.UtcNow
            };
            var result = await userManager.CreateAsync(admin, "Pavanadmin@123");
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(admin, "Admin");
            }
        }

        // 4. Seed Movies
        if (!await context.Movies.AnyAsync())
        {
            var movies = new List<Movie>
            {
                new()
                {
                    Title = "Avengers: Endgame",
                    Description = "After the devastating events of Avengers: Infinity War, the universe is in ruins. With the help of remaining allies, the Avengers assemble once more to reverse Thanos's actions and restore balance to the universe.",
                    DurationMinutes = 181,
                    Genre = "Action, Adventure, Sci-Fi",
                    PosterUrl = "https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg",
                    
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },
                new()
                {
                    Title = "Oppenheimer",
                    Description = "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II.",
                    DurationMinutes = 180,
                    Genre = "Biography, Drama, History",
                    PosterUrl = "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
                    
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },
                new()
                {
                    Title = "Interstellar",
                    Description = "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival. A visually stunning and emotionally powerful epic from Christopher Nolan.",
                    DurationMinutes = 169,
                    Genre = "Adventure, Drama, Sci-Fi",
                    PosterUrl = "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
                    
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },
                new()
                {
                    Title = "The Dark Knight",
                    Description = "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.",
                    DurationMinutes = 152,
                    Genre = "Action, Crime, Drama",
                    PosterUrl = "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
                    
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },
                new()
                {
                    Title = "Inception",
                    Description = "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.",
                    DurationMinutes = 148,
                    Genre = "Action, Adventure, Sci-Fi",
                    PosterUrl = "https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg",
                    
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },
                new()
                {
                    Title = "Dune: Part Two",
                    Description = "Paul Atreides unites with Chani and the Fremen while on a warpath of revenge against the conspirators who destroyed his family.",
                    DurationMinutes = 166,
                    Genre = "Action, Adventure, Sci-Fi",
                    PosterUrl = "https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
                    
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },
                new()
                {
                    Title = "Spider-Man: Across the Spider-Verse",
                    Description = "Miles Morales catapults across the Multiverse, where he encounters a team of Spider-People charged with protecting its very existence.",
                    DurationMinutes = 140,
                    Genre = "Animation, Action, Adventure",
                    PosterUrl = "https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg",
                    
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },
                new()
                {
                    Title = "RRR",
                    Description = "A fictitious story about two legendary revolutionaries and their journey away from home before they started fighting for their country in the 1920s.",
                    DurationMinutes = 187,
                    Genre = "Action, Drama, History",
                    PosterUrl = "https://image.tmdb.org/t/p/w500/u3bZgnGQ9T01sWNhyveQz0wH0Hl.jpg",
                    
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                }
            };

            await context.Movies.AddRangeAsync(movies);
            await context.SaveChangesAsync();
        }
    }
}
