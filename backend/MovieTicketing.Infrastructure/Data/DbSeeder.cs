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
                    Title = "Deadpool & Wolverine",
                    Description = "Deadpool is offered a place in the Marvel Cinematic Universe by the Time Variance Authority, but instead recruits a variant of Wolverine to save his universe from extinction.",
                    DurationMinutes = 128,
                    Genre = "Action, Comedy, Sci-Fi",
                    PosterUrl = "https://upload.wikimedia.org/wikipedia/en/4/4c/Deadpool_%26_Wolverine_poster.jpg",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },
                new()
                {
                    Title = "Interstellar",
                    Description = "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.",
                    DurationMinutes = 169,
                    Genre = "Adventure, Drama, Sci-Fi",
                    PosterUrl = "https://upload.wikimedia.org/wikipedia/en/b/bc/Interstellar_film_poster.jpg",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },
                new()
                {
                    Title = "Inside Out 2",
                    Description = "A sequel that features Riley entering puberty and experiencing brand new, more complex emotions as a result.",
                    DurationMinutes = 96,
                    Genre = "Animation, Adventure, Comedy",
                    PosterUrl = "https://upload.wikimedia.org/wikipedia/en/f/f7/Inside_Out_2_poster.jpg",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                }
            };

            await context.Movies.AddRangeAsync(movies);
            await context.SaveChangesAsync();
        }


    }
}
