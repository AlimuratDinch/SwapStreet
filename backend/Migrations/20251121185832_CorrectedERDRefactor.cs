using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class CorrectedERDRefactor : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_wishlists_listings_LsitingId",
                table: "wishlists");

            migrationBuilder.DropIndex(
                name: "IX_wishlists_LsitingId",
                table: "wishlists");

            migrationBuilder.AlterColumn<Guid>(
                name: "LsitingId",
                table: "wishlists",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AddColumn<Guid>(
                name: "ListingId",
                table: "wishlists",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateIndex(
                name: "IX_wishlists_ListingId",
                table: "wishlists",
                column: "ListingId");

            migrationBuilder.AddForeignKey(
                name: "FK_wishlists_listings_ListingId",
                table: "wishlists",
                column: "ListingId",
                principalTable: "listings",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_wishlists_listings_ListingId",
                table: "wishlists");

            migrationBuilder.DropIndex(
                name: "IX_wishlists_ListingId",
                table: "wishlists");

            migrationBuilder.DropColumn(
                name: "ListingId",
                table: "wishlists");

            migrationBuilder.AlterColumn<Guid>(
                name: "LsitingId",
                table: "wishlists",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_wishlists_LsitingId",
                table: "wishlists",
                column: "LsitingId");

            migrationBuilder.AddForeignKey(
                name: "FK_wishlists_listings_LsitingId",
                table: "wishlists",
                column: "LsitingId",
                principalTable: "listings",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
