using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;
using PcBuilderBackend.Domain.Enums;

#nullable disable

namespace PcBuilderBackend.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class ChassisDriveBayFormFactors : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<List<DriveBayFormFactor>>(
                name: "DriveBayFormFactors",
                table: "ChassisDriveBays",
                type: "drive_bay_form_factor[]",
                nullable: true);

            migrationBuilder.Sql(
                """
                UPDATE "ChassisDriveBays"
                SET "DriveBayFormFactors" = ARRAY["DriveBayFormFactor"];
                """);

            migrationBuilder.AlterColumn<List<DriveBayFormFactor>>(
                name: "DriveBayFormFactors",
                table: "ChassisDriveBays",
                type: "drive_bay_form_factor[]",
                nullable: false,
                oldClrType: typeof(List<DriveBayFormFactor>),
                oldType: "drive_bay_form_factor[]",
                oldNullable: true);

            migrationBuilder.DropIndex(
                name: "IX_ChassisDriveBays_ChassisId_DriveBayFormFactor",
                table: "ChassisDriveBays");

            migrationBuilder.DropColumn(
                name: "DriveBayFormFactor",
                table: "ChassisDriveBays");

            migrationBuilder.CreateIndex(
                name: "IX_ChassisDriveBays_ChassisId",
                table: "ChassisDriveBays",
                column: "ChassisId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ChassisDriveBays_ChassisId",
                table: "ChassisDriveBays");

            migrationBuilder.DropColumn(
                name: "DriveBayFormFactors",
                table: "ChassisDriveBays");

            migrationBuilder.AddColumn<DriveBayFormFactor>(
                name: "DriveBayFormFactor",
                table: "ChassisDriveBays",
                type: "drive_bay_form_factor",
                nullable: false,
                defaultValue: (DriveBayFormFactor)0);

            migrationBuilder.CreateIndex(
                name: "IX_ChassisDriveBays_ChassisId_DriveBayFormFactor",
                table: "ChassisDriveBays",
                columns: new[] { "ChassisId", "DriveBayFormFactor" },
                unique: true);
        }
    }
}
