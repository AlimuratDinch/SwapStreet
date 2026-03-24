using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddListingSize : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_tags_sizes_SizeId",
                table: "tags");

            migrationBuilder.DropTable(
                name: "sizes");

            migrationBuilder.DropIndex(
                name: "IX_tags_SizeId",
                table: "tags");

            migrationBuilder.DropColumn(
                name: "SizeId",
                table: "tags");

            migrationBuilder.AddColumn<int>(
                name: "Size",
                table: "listings",
                type: "integer",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Size",
                table: "listings");

            migrationBuilder.AddColumn<Guid>(
                name: "SizeId",
                table: "tags",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateTable(
                name: "sizes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ArticleTypeId = table.Column<Guid>(type: "uuid", nullable: false),
                    DisplayOrder = table.Column<int>(type: "integer", nullable: false),
                    Value = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_sizes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_sizes_article_types_ArticleTypeId",
                        column: x => x.ArticleTypeId,
                        principalTable: "article_types",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_tags_SizeId",
                table: "tags",
                column: "SizeId");

            migrationBuilder.CreateIndex(
                name: "IX_sizes_ArticleTypeId",
                table: "sizes",
                column: "ArticleTypeId");

            migrationBuilder.AddForeignKey(
                name: "FK_tags_sizes_SizeId",
                table: "tags",
                column: "SizeId",
                principalTable: "sizes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
