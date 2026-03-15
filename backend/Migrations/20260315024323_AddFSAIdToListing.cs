using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddFSAIdToListing : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FSA",
                table: "listings");

            migrationBuilder.AddColumn<int>(
                name: "FSAId",
                table: "listings",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_listings_FSAId",
                table: "listings",
                column: "FSAId");

            migrationBuilder.AddForeignKey(
                name: "FK_listings_fsas_FSAId",
                table: "listings",
                column: "FSAId",
                principalTable: "fsas",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_listings_fsas_FSAId",
                table: "listings");

            migrationBuilder.DropIndex(
                name: "IX_listings_FSAId",
                table: "listings");

            migrationBuilder.DropColumn(
                name: "FSAId",
                table: "listings");

            migrationBuilder.AddColumn<string>(
                name: "FSA",
                table: "listings",
                type: "character varying(3)",
                maxLength: 3,
                nullable: false,
                defaultValue: "");
        }
    }
}
