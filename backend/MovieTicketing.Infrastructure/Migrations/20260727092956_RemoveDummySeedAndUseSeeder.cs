using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace MovieTicketing.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RemoveDummySeedAndUseSeeder : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Movies",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"));

            migrationBuilder.DeleteData(
                table: "Movies",
                keyColumn: "Id",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"));

            migrationBuilder.DeleteData(
                table: "Movies",
                keyColumn: "Id",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"));

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "Movies",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "Movies",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "Movies");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "Movies");

            migrationBuilder.InsertData(
                table: "Movies",
                columns: new[] { "Id", "CreatedAt", "Description", "DurationInMinutes", "Genre", "PosterUrl", "ReleaseDate", "Title" },
                values: new object[,]
                {
                    { new Guid("11111111-1111-1111-1111-111111111111"), new DateTime(2023, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "A thief who steals corporate secrets through the use of dream-sharing technology.", 148, "Sci-Fi, Action", "https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg", new DateTime(2010, 7, 16, 0, 0, 0, 0, DateTimeKind.Utc), "Inception" },
                    { new Guid("22222222-2222-2222-2222-222222222222"), new DateTime(2023, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham.", 152, "Action, Crime, Drama", "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg", new DateTime(2008, 7, 18, 0, 0, 0, 0, DateTimeKind.Utc), "The Dark Knight" },
                    { new Guid("33333333-3333-3333-3333-333333333333"), new DateTime(2023, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.", 169, "Adventure, Drama, Sci-Fi", "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MvrIdY1b.jpg", new DateTime(2014, 11, 7, 0, 0, 0, 0, DateTimeKind.Utc), "Interstellar" }
                });
        }
    }
}
