using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace KwintBaseHarmony.Migrations
{
    /// <inheritdoc />
    public partial class AddStyle : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Style",
                table: "Compositions",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "classical");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Style",
                table: "Compositions");
        }
    }
}
