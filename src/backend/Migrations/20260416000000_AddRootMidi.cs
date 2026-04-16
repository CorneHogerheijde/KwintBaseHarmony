using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace KwintBaseHarmony.Migrations
{
    /// <inheritdoc />
    public partial class AddRootMidi : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "RootMidi",
                table: "Compositions",
                type: "integer",
                nullable: false,
                defaultValue: 60);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RootMidi",
                table: "Compositions");
        }
    }
}
