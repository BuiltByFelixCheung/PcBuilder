using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PcBuilderBackend.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCpuCoolerFanDimensions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "FanCount",
                table: "CpuCoolers",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "FanHeightMm",
                table: "CpuCoolers",
                type: "numeric(6,2)",
                precision: 6,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "FanLengthMm",
                table: "CpuCoolers",
                type: "numeric(6,2)",
                precision: 6,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "FanWidthMm",
                table: "CpuCoolers",
                type: "numeric(6,2)",
                precision: 6,
                scale: 2,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FanCount",
                table: "CpuCoolers");

            migrationBuilder.DropColumn(
                name: "FanHeightMm",
                table: "CpuCoolers");

            migrationBuilder.DropColumn(
                name: "FanLengthMm",
                table: "CpuCoolers");

            migrationBuilder.DropColumn(
                name: "FanWidthMm",
                table: "CpuCoolers");
        }
    }
}
