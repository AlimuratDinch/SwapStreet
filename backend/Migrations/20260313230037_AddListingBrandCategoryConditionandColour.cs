using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddListingBrandCategoryConditionandColour : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_listings_tags_TagId",
                table: "listings");

            migrationBuilder.DropTable(
                name: "tags");

            migrationBuilder.DropTable(
                name: "styles");

            migrationBuilder.DropIndex(
                name: "IX_listings_TagId",
                table: "listings");

            migrationBuilder.DropColumn(
                name: "TagId",
                table: "listings");

            migrationBuilder.AlterColumn<string>(
                name: "Size",
                table: "listings",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Brand",
                table: "listings",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Category",
                table: "listings",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Colour",
                table: "listings",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Condition",
                table: "listings",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Brand",
                table: "listings");

            migrationBuilder.DropColumn(
                name: "Category",
                table: "listings");

            migrationBuilder.DropColumn(
                name: "Colour",
                table: "listings");

            migrationBuilder.DropColumn(
                name: "Condition",
                table: "listings");

            migrationBuilder.AlterColumn<string>(
                name: "Size",
                table: "listings",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AddColumn<Guid>(
                name: "TagId",
                table: "listings",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "styles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Description = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_styles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "tags",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ArticleTypeId = table.Column<Guid>(type: "uuid", nullable: false),
                    BrandId = table.Column<Guid>(type: "uuid", nullable: false),
                    StyleId = table.Column<Guid>(type: "uuid", nullable: false),
                    Color = table.Column<int>(type: "integer", nullable: false),
                    Condition = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Material = table.Column<int>(type: "integer", nullable: false),
                    Sex = table.Column<int>(type: "integer", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tags", x => x.Id);
                    table.ForeignKey(
                        name: "FK_tags_article_types_ArticleTypeId",
                        column: x => x.ArticleTypeId,
                        principalTable: "article_types",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_tags_brands_BrandId",
                        column: x => x.BrandId,
                        principalTable: "brands",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_tags_styles_StyleId",
                        column: x => x.StyleId,
                        principalTable: "styles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_listings_TagId",
                table: "listings",
                column: "TagId");

            migrationBuilder.CreateIndex(
                name: "IX_tags_ArticleTypeId",
                table: "tags",
                column: "ArticleTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_tags_BrandId",
                table: "tags",
                column: "BrandId");

            migrationBuilder.CreateIndex(
                name: "IX_tags_StyleId",
                table: "tags",
                column: "StyleId");

            migrationBuilder.AddForeignKey(
                name: "FK_listings_tags_TagId",
                table: "listings",
                column: "TagId",
                principalTable: "tags",
                principalColumn: "Id");
        }
    }
}
