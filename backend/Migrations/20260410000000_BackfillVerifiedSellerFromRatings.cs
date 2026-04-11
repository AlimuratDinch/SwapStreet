using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using backend.DbContexts;

#nullable disable

namespace backend.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20260410000000_BackfillVerifiedSellerFromRatings")]
    public partial class BackfillVerifiedSellerFromRatings : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                UPDATE profiles AS p
                SET "VerifiedSeller" = (
                    SELECT (COUNT(*) >= 5 AND COALESCE(AVG(r."Stars"), 0) >= 4.0)
                    FROM chat_ratings AS r
                    WHERE r."RevieweeId" = p."Id"
                );
                """);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                UPDATE profiles
                SET "VerifiedSeller" = false;
                """);
        }
    }
}
