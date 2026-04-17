using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace KwintBaseHarmony.Migrations
{
    /// <inheritdoc />
    public partial class AddMovements : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "MovementNumber",
                table: "Compositions",
                type: "integer",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<Guid>(
                name: "ParentCompositionId",
                table: "Compositions",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Compositions_ParentCompositionId",
                table: "Compositions",
                column: "ParentCompositionId");

            migrationBuilder.AddForeignKey(
                name: "FK_Compositions_Compositions_ParentCompositionId",
                table: "Compositions",
                column: "ParentCompositionId",
                principalTable: "Compositions",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Compositions_Compositions_ParentCompositionId",
                table: "Compositions");

            migrationBuilder.DropIndex(
                name: "IX_Compositions_ParentCompositionId",
                table: "Compositions");

            migrationBuilder.DropColumn(
                name: "MovementNumber",
                table: "Compositions");

            migrationBuilder.DropColumn(
                name: "ParentCompositionId",
                table: "Compositions");
        }
    }
}
