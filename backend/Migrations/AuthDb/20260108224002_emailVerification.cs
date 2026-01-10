using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations.AuthDb
{
    /// <inheritdoc />
    public partial class emailVerification : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "ConfirmationEmailSentAt",
                schema: "auth",
                table: "users",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ConfirmationToken",
                schema: "auth",
                table: "users",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "ConfirmationTokenExpiresAt",
                schema: "auth",
                table: "users",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ConfirmationEmailSentAt",
                schema: "auth",
                table: "users");

            migrationBuilder.DropColumn(
                name: "ConfirmationToken",
                schema: "auth",
                table: "users");

            migrationBuilder.DropColumn(
                name: "ConfirmationTokenExpiresAt",
                schema: "auth",
                table: "users");
        }
    }
}
