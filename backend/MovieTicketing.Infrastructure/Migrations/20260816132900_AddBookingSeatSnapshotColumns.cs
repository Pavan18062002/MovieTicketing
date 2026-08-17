using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MovieTicketing.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddBookingSeatSnapshotColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Add SeatNumber snapshot column — stores the seat label (e.g. "A12") at time of purchase
            migrationBuilder.AddColumn<string>(
                name: "SeatNumber",
                table: "BookingSeats",
                type: "character varying(10)",
                maxLength: 10,
                nullable: false,
                defaultValue: "");

            // Add SeatType snapshot column — stores the seat category (Standard/Premium/VIP) at time of purchase
            migrationBuilder.AddColumn<int>(
                name: "SeatType",
                table: "BookingSeats",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SeatNumber",
                table: "BookingSeats");

            migrationBuilder.DropColumn(
                name: "SeatType",
                table: "BookingSeats");
        }
    }
}
