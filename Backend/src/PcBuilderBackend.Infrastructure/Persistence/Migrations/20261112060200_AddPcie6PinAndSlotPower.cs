using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PcBuilderBackend.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPcie6PinAndSlotPower : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                "ALTER TYPE psu_cable_type ADD VALUE 'none';",
                suppressTransaction: true);
            migrationBuilder.Sql(
                "ALTER TYPE psu_cable_type ADD VALUE 'pcie6pin';",
                suppressTransaction: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // PostgreSQL cannot drop a single enum label without recreating the type.
        }
    }
}
