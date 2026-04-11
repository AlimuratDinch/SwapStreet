using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class SustainabilityVector : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "sustainability_vectors",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    CO2Kg = table.Column<decimal>(type: "numeric(10,2)", nullable: false, defaultValue: 0m),
                    WaterL = table.Column<decimal>(type: "numeric(10,2)", nullable: false, defaultValue: 0m),
                    ElectricityKWh = table.Column<decimal>(type: "numeric(10,2)", nullable: false, defaultValue: 0m),
                    ToxicChemicalsG = table.Column<decimal>(type: "numeric(10,2)", nullable: false, defaultValue: 0m),
                    LandfillKg = table.Column<decimal>(type: "numeric(10,2)", nullable: false, defaultValue: 0m),
                    Articles = table.Column<int>(type: "integer", nullable: false, defaultValue: 0)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_sustainability_vectors", x => x.Id);
                    table.ForeignKey(
                        name: "FK_sustainability_vectors_profiles_UserId",
                        column: x => x.UserId,
                        principalTable: "profiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_sustainability_vectors_UserId",
                table: "sustainability_vectors",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "sustainability_vectors");
        }
    }
}
