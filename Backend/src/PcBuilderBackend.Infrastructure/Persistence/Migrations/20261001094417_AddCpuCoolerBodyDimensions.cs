using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PcBuilderBackend.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCpuCoolerBodyDimensions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "CoolerLengthMm",
                table: "CpuCoolers",
                type: "numeric(6,2)",
                precision: 6,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "CoolerWidthMm",
                table: "CpuCoolers",
                type: "numeric(6,2)",
                precision: 6,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "WaterBlockHeightMm",
                table: "CpuCoolers",
                type: "numeric(6,2)",
                precision: 6,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "WaterBlockLengthMm",
                table: "CpuCoolers",
                type: "numeric(6,2)",
                precision: 6,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "WaterBlockWidthMm",
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
                name: "CoolerLengthMm",
                table: "CpuCoolers");

            migrationBuilder.DropColumn(
                name: "CoolerWidthMm",
                table: "CpuCoolers");

            migrationBuilder.DropColumn(
                name: "WaterBlockHeightMm",
                table: "CpuCoolers");

            migrationBuilder.DropColumn(
                name: "WaterBlockLengthMm",
                table: "CpuCoolers");

            migrationBuilder.DropColumn(
                name: "WaterBlockWidthMm",
                table: "CpuCoolers");
        }
    }
}
