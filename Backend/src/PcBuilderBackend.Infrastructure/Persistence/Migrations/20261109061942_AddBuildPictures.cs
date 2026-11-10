using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PcBuilderBackend.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddBuildPictures : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "BuildPictures",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BuildId = table.Column<Guid>(type: "uuid", nullable: false),
                    PictureKey = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    ConcurrencyToken = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BuildPictures", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BuildPictures_PcBuilds_BuildId",
                        column: x => x.BuildId,
                        principalTable: "PcBuilds",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BuildPictures_BuildId",
                table: "BuildPictures",
                column: "BuildId");

            migrationBuilder.CreateIndex(
                name: "IX_BuildPictures_PictureKey",
                table: "BuildPictures",
                column: "PictureKey",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BuildPictures");
        }
    }
}
