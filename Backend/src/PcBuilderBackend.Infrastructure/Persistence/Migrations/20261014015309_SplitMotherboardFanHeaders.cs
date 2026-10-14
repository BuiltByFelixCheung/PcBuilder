using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PcBuilderBackend.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class SplitMotherboardFanHeaders : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "FanConnectors",
                table: "Motherboards",
                newName: "PwmFanHeaders");

            migrationBuilder.AddColumn<int>(
                name: "DcFanHeaders",
                table: "Motherboards",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DcFanHeaders",
                table: "Motherboards");

            migrationBuilder.RenameColumn(
                name: "PwmFanHeaders",
                table: "Motherboards",
                newName: "FanConnectors");
        }
    }
}
