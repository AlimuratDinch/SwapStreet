using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddPgTrgmSearchTextStoredTrue : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "SearchText",
                table: "listings",
                type: "text",
                nullable: true,
                computedColumnSql: "COALESCE(Title || ' ' || Description || ' ', '') STORED",
                stored: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true,
                oldComputedColumnSql: "COALESCE(Title || ' ' || Description || ' ', '') STORED",
                oldStored: null);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "SearchText",
                table: "listings",
                type: "text",
                nullable: true,
                computedColumnSql: "COALESCE(Title || ' ' || Description || ' ', '') STORED",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true,
                oldComputedColumnSql: "COALESCE(Title || ' ' || Description || ' ', '') STORED");
        }
    }
}
