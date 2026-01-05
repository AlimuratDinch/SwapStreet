using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class chatting : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "chatrooms",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CreationTime = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    SellerId = table.Column<Guid>(type: "uuid", nullable: false),
                    BuyerId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_chatrooms", x => x.Id);
                    table.ForeignKey(
                        name: "FK_chatrooms_profiles_BuyerId",
                        column: x => x.BuyerId,
                        principalTable: "profiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_chatrooms_profiles_SellerId",
                        column: x => x.SellerId,
                        principalTable: "profiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "messages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SendDate = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    Content = table.Column<string>(type: "text", nullable: false),
                    ChatroomId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_messages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_messages_chatrooms_ChatroomId",
                        column: x => x.ChatroomId,
                        principalTable: "chatrooms",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_chatrooms_BuyerId",
                table: "chatrooms",
                column: "BuyerId");

            migrationBuilder.CreateIndex(
                name: "IX_chatrooms_SellerId",
                table: "chatrooms",
                column: "SellerId");

            migrationBuilder.CreateIndex(
                name: "IX_messages_ChatroomId",
                table: "messages",
                column: "ChatroomId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "messages");

            migrationBuilder.DropTable(
                name: "chatrooms");
        }
    }
}
