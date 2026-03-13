using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class ExpandProfileFSA : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "FSA",
                table: "profiles",
                type: "varchar(7)",
                maxLength: 7,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(3)",
                oldMaxLength: 3);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "FSA",
                table: "profiles",
                type: "varchar(3)",
                maxLength: 3,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(7)",
                oldMaxLength: 7);
        }
    }
}
