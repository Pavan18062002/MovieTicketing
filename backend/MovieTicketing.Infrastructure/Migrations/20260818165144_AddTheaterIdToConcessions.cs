using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace MovieTicketing.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTheaterIdToConcessions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("ALTER TABLE \"ConcessionItems\" ADD COLUMN IF NOT EXISTS \"TheaterId\" integer;");

            migrationBuilder.Sql(@"
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM pg_constraint WHERE conname = 'FK_ConcessionItems_Theaters_TheaterId'
                    ) THEN
                        ALTER TABLE ""ConcessionItems"" 
                        ADD CONSTRAINT ""FK_ConcessionItems_Theaters_TheaterId"" 
                        FOREIGN KEY (""TheaterId"") REFERENCES ""Theaters"" (""Id"") ON DELETE CASCADE;
                    END IF;
                END $$;
            ");

            migrationBuilder.Sql("CREATE INDEX IF NOT EXISTS \"IX_ConcessionItems_TheaterId\" ON \"ConcessionItems\" (\"TheaterId\");");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("ALTER TABLE \"ConcessionItems\" DROP COLUMN IF EXISTS \"TheaterId\";");
        }
    }
}
