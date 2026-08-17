using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MovieTicketing.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdateScreenColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                ALTER TABLE ""Screens"" ADD COLUMN IF NOT EXISTS ""PremiumRows"" integer NOT NULL DEFAULT 5;
                ALTER TABLE ""Screens"" ADD COLUMN IF NOT EXISTS ""VipRows"" integer NOT NULL DEFAULT 2;
                ALTER TABLE ""Screens"" ADD COLUMN IF NOT EXISTS ""PremiumMultiplier"" numeric NOT NULL DEFAULT 1.3;
                ALTER TABLE ""Screens"" ADD COLUMN IF NOT EXISTS ""VipMultiplier"" numeric NOT NULL DEFAULT 1.6;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
        }
    }
}
