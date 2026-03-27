using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;
using backend.DbContexts;

#nullable disable

namespace backend.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20260307120000_AddChatDealAndRatings")]
    public partial class AddChatDealAndRatings : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "ClosedAt",
                table: "chatrooms",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDealClosed",
                table: "chatrooms",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "ListingId",
                table: "chatrooms",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "chat_ratings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ChatroomId = table.Column<Guid>(type: "uuid", nullable: false),
                    ReviewerId = table.Column<Guid>(type: "uuid", nullable: false),
                    RevieweeId = table.Column<Guid>(type: "uuid", nullable: false),
                    Stars = table.Column<int>(type: "integer", nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_chat_ratings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_chat_ratings_chatrooms_ChatroomId",
                        column: x => x.ChatroomId,
                        principalTable: "chatrooms",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_chat_ratings_profiles_RevieweeId",
                        column: x => x.RevieweeId,
                        principalTable: "profiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_chat_ratings_profiles_ReviewerId",
                        column: x => x.ReviewerId,
                        principalTable: "profiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_chatrooms_ListingId",
                table: "chatrooms",
                column: "ListingId");

            migrationBuilder.CreateIndex(
                name: "IX_chat_ratings_ChatroomId_ReviewerId",
                table: "chat_ratings",
                columns: new[] { "ChatroomId", "ReviewerId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_chat_ratings_RevieweeId",
                table: "chat_ratings",
                column: "RevieweeId");

            migrationBuilder.CreateIndex(
                name: "IX_chat_ratings_ReviewerId",
                table: "chat_ratings",
                column: "ReviewerId");

            migrationBuilder.AddForeignKey(
                name: "FK_chatrooms_listings_ListingId",
                table: "chatrooms",
                column: "ListingId",
                principalTable: "listings",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_chatrooms_listings_ListingId",
                table: "chatrooms");

            migrationBuilder.DropTable(
                name: "chat_ratings");

            migrationBuilder.DropIndex(
                name: "IX_chatrooms_ListingId",
                table: "chatrooms");

            migrationBuilder.DropColumn(
                name: "ClosedAt",
                table: "chatrooms");

            migrationBuilder.DropColumn(
                name: "IsDealClosed",
                table: "chatrooms");

            migrationBuilder.DropColumn(
                name: "ListingId",
                table: "chatrooms");
        }
    }
}
