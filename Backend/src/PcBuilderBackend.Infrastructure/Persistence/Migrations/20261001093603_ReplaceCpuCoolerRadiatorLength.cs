using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PcBuilderBackend.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class ReplaceCpuCoolerRadiatorLength : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MaxTdp",
                table: "CpuCoolers");

            migrationBuilder.Sql(
                """
                ALTER TYPE radiator_length RENAME TO radiator_class;
                ALTER TABLE "CpuCoolers" RENAME COLUMN "RadiatorLength" TO "RadiatorClass";
                """);

            migrationBuilder.AddColumn<decimal>(
                name: "RadiatorHeightMm",
                table: "CpuCoolers",
                type: "numeric(6,2)",
                precision: 6,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "RadiatorLengthMm",
                table: "CpuCoolers",
                type: "numeric(6,2)",
                precision: 6,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "RadiatorWidthMm",
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
                name: "RadiatorHeightMm",
                table: "CpuCoolers");

            migrationBuilder.DropColumn(
                name: "RadiatorLengthMm",
                table: "CpuCoolers");

            migrationBuilder.DropColumn(
                name: "RadiatorWidthMm",
                table: "CpuCoolers");

            migrationBuilder.Sql(
                """
                ALTER TABLE "CpuCoolers" RENAME COLUMN "RadiatorClass" TO "RadiatorLength";
                ALTER TYPE radiator_class RENAME TO radiator_length;
                """);

            migrationBuilder.AddColumn<int>(
                name: "MaxTdp",
                table: "CpuCoolers",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }
    }
}
