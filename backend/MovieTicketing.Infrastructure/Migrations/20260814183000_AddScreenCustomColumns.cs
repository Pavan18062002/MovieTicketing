using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MovieTicketing.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddScreenCustomColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "PremiumRows",
                table: "Screens",
                type: "integer",
                nullable: false,
                defaultValue: 5);

            migrationBuilder.AddColumn<int>(
                name: "VipRows",
                table: "Screens",
                type: "integer",
                nullable: false,
                defaultValue: 2);

            migrationBuilder.AddColumn<decimal>(
                name: "PremiumMultiplier",
                table: "Screens",
                type: "numeric",
                nullable: false,
                defaultValue: 1.3m);

            migrationBuilder.AddColumn<decimal>(
                name: "VipMultiplier",
                table: "Screens",
                type: "numeric",
                nullable: false,
                defaultValue: 1.6m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PremiumRows",
                table: "Screens");

            migrationBuilder.DropColumn(
                name: "VipRows",
                table: "Screens");

            migrationBuilder.DropColumn(
                name: "PremiumMultiplier",
                table: "Screens");

            migrationBuilder.DropColumn(
                name: "VipMultiplier",
                table: "Screens");
        }
    }
}
