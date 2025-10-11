using System;
using System.Text.Json;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations.AuthDb
{
    /// <inheritdoc />
    public partial class removed_sessions_identities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "identities",
                schema: "auth");

            migrationBuilder.DropTable(
                name: "sessions",
                schema: "auth");

            migrationBuilder.DropColumn(
                name: "ConfirmationSentAt",
                schema: "auth",
                table: "users");

            migrationBuilder.DropColumn(
                name: "ConfirmationToken",
                schema: "auth",
                table: "users");

            migrationBuilder.DropColumn(
                name: "EmailChange",
                schema: "auth",
                table: "users");

            migrationBuilder.DropColumn(
                name: "EmailChangeSentAt",
                schema: "auth",
                table: "users");

            migrationBuilder.DropColumn(
                name: "InstanceId",
                schema: "auth",
                table: "users");

            migrationBuilder.DropColumn(
                name: "InvitedAt",
                schema: "auth",
                table: "users");

            migrationBuilder.DropColumn(
                name: "RawAppMetaData",
                schema: "auth",
                table: "users");

            migrationBuilder.DropColumn(
                name: "RawUserMetaData",
                schema: "auth",
                table: "users");

            migrationBuilder.DropColumn(
                name: "RecoveryToken",
                schema: "auth",
                table: "users");

            migrationBuilder.RenameColumn(
                name: "Role",
                schema: "auth",
                table: "users",
                newName: "Username");

            migrationBuilder.RenameColumn(
                name: "RecoverySentAt",
                schema: "auth",
                table: "users",
                newName: "DeletedAt");

            migrationBuilder.RenameColumn(
                name: "IsSuperAdmin",
                schema: "auth",
                table: "users",
                newName: "IsDeleted");

            migrationBuilder.RenameColumn(
                name: "Aud",
                schema: "auth",
                table: "users",
                newName: "Status");

            migrationBuilder.AddColumn<bool>(
                name: "IsAdmin",
                schema: "auth",
                table: "users",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            // NOTE: keep Parent as uuid to avoid destructive or invalid casts during migration
            // migrationBuilder.AlterColumn<long>(
            //     name: "Parent",
            //     schema: "auth",
            //     table: "refresh_tokens",
            //     type: "bigint",
            //     nullable: true,
            //     oldClrType: typeof(Guid),
            //     oldType: "uuid",
            //     oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DeviceId",
                schema: "auth",
                table: "refresh_tokens",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "ExpiresAt",
                schema: "auth",
                table: "refresh_tokens",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Ip",
                schema: "auth",
                table: "refresh_tokens",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UserAgent",
                schema: "auth",
                table: "refresh_tokens",
                type: "text",
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Payload",
                schema: "auth",
                table: "audit_log_entries",
                type: "text",
                nullable: false,
                oldClrType: typeof(JsonDocument),
                oldType: "jsonb");

            migrationBuilder.CreateIndex(
                name: "IX_users_Email",
                schema: "auth",
                table: "users",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_users_Username",
                schema: "auth",
                table: "users",
                column: "Username",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_users_Email",
                schema: "auth",
                table: "users");

            migrationBuilder.DropIndex(
                name: "IX_users_Username",
                schema: "auth",
                table: "users");

            migrationBuilder.DropColumn(
                name: "IsAdmin",
                schema: "auth",
                table: "users");

            migrationBuilder.DropColumn(
                name: "DeviceId",
                schema: "auth",
                table: "refresh_tokens");

            migrationBuilder.DropColumn(
                name: "ExpiresAt",
                schema: "auth",
                table: "refresh_tokens");

            migrationBuilder.DropColumn(
                name: "Ip",
                schema: "auth",
                table: "refresh_tokens");

            migrationBuilder.DropColumn(
                name: "UserAgent",
                schema: "auth",
                table: "refresh_tokens");

            migrationBuilder.RenameColumn(
                name: "Username",
                schema: "auth",
                table: "users",
                newName: "Role");

            migrationBuilder.RenameColumn(
                name: "Status",
                schema: "auth",
                table: "users",
                newName: "Aud");

            migrationBuilder.RenameColumn(
                name: "IsDeleted",
                schema: "auth",
                table: "users",
                newName: "IsSuperAdmin");

            migrationBuilder.RenameColumn(
                name: "DeletedAt",
                schema: "auth",
                table: "users",
                newName: "RecoverySentAt");

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "ConfirmationSentAt",
                schema: "auth",
                table: "users",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ConfirmationToken",
                schema: "auth",
                table: "users",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "EmailChange",
                schema: "auth",
                table: "users",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "EmailChangeSentAt",
                schema: "auth",
                table: "users",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "InstanceId",
                schema: "auth",
                table: "users",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "InvitedAt",
                schema: "auth",
                table: "users",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<JsonDocument>(
                name: "RawAppMetaData",
                schema: "auth",
                table: "users",
                type: "jsonb",
                nullable: false);

            migrationBuilder.AddColumn<JsonDocument>(
                name: "RawUserMetaData",
                schema: "auth",
                table: "users",
                type: "jsonb",
                nullable: false);

            migrationBuilder.AddColumn<string>(
                name: "RecoveryToken",
                schema: "auth",
                table: "users",
                type: "text",
                nullable: false,
                defaultValue: "");

            // NOTE: keep Parent as uuid in Down as well; removed the alter column to avoid type conversion issues
            // migrationBuilder.AlterColumn<Guid>(
            //     name: "Parent",
            //     schema: "auth",
            //     table: "refresh_tokens",
            //     type: "uuid",
            //     nullable: true,
            //     oldClrType: typeof(long),
            //     oldType: "bigint",
            //     oldNullable: true);

            migrationBuilder.AlterColumn<JsonDocument>(
                name: "Payload",
                schema: "auth",
                table: "audit_log_entries",
                type: "jsonb",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.CreateTable(
                name: "identities",
                schema: "auth",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    IdentityData = table.Column<JsonDocument>(type: "jsonb", nullable: false),
                    LastSignInAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    Provider = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    ProviderId = table.Column<string>(type: "text", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_identities", x => x.Id);
                    table.ForeignKey(
                        name: "FK_identities_users_UserId",
                        column: x => x.UserId,
                        principalSchema: "auth",
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "sessions",
                schema: "auth",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    AmrClaims = table.Column<JsonDocument>(type: "jsonb", nullable: false),
                    AuthenticatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    AuthenticationMethod = table.Column<string>(type: "text", nullable: false),
                    ConfirmedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    DeletedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    FactorId = table.Column<Guid>(type: "uuid", nullable: true),
                    Ip = table.Column<string>(type: "text", nullable: false),
                    NotAfter = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    Tag = table.Column<string>(type: "text", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UserAgent = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_sessions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_sessions_users_UserId",
                        column: x => x.UserId,
                        principalSchema: "auth",
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_identities_UserId",
                schema: "auth",
                table: "identities",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_sessions_UserId",
                schema: "auth",
                table: "sessions",
                column: "UserId");
        }
    }
}
