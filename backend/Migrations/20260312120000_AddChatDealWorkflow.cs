using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;
using backend.DbContexts;

#nullable disable

namespace backend.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20260312120000_AddChatDealWorkflow")]
    public partial class AddChatDealWorkflow : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsArchived",
                table: "chatrooms",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "ArchivedAt",
                table: "chatrooms",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsFrozen",
                table: "chatrooms",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "FrozenReason",
                table: "chatrooms",
                type: "character varying(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "CloseRequestedById",
                table: "chatrooms",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "CloseRequestedAt",
                table: "chatrooms",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "CloseConfirmedBySeller",
                table: "chatrooms",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "CloseConfirmedByBuyer",
                table: "chatrooms",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "IsArchived", table: "chatrooms");
            migrationBuilder.DropColumn(name: "ArchivedAt", table: "chatrooms");
            migrationBuilder.DropColumn(name: "IsFrozen", table: "chatrooms");
            migrationBuilder.DropColumn(name: "FrozenReason", table: "chatrooms");
            migrationBuilder.DropColumn(name: "CloseRequestedById", table: "chatrooms");
            migrationBuilder.DropColumn(name: "CloseRequestedAt", table: "chatrooms");
            migrationBuilder.DropColumn(name: "CloseConfirmedBySeller", table: "chatrooms");
            migrationBuilder.DropColumn(name: "CloseConfirmedByBuyer", table: "chatrooms");
        }
    }
}
