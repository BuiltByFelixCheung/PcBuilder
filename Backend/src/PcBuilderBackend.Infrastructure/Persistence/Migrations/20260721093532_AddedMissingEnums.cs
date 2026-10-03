using Microsoft.EntityFrameworkCore.Migrations;
using PcBuilderBackend.Domain.Enums;

#nullable disable

namespace PcBuilderBackend.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddedMissingEnums : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .Annotation("Npgsql:Enum:bluetooth_version", "v5point0,v5point1,v5point2,v5point3,v5point4")
                .Annotation("Npgsql:Enum:cpu_cooler_type", "air,water")
                .Annotation("Npgsql:Enum:ddr_generation", "ddr4,ddr5")
                .Annotation("Npgsql:Enum:drive_bay_form_factor", "inch25,inch35,inch525")
                .Annotation("Npgsql:Enum:fan_diameter_mm", "mm80,mm92,mm120,mm140,mm200")
                .Annotation("Npgsql:Enum:fan_mount_location", "front,top,bottom,rear,sides")
                .Annotation("Npgsql:Enum:m2_form_factor", "m22230,m22242,m22260,m22280,m222110")
                .Annotation("Npgsql:Enum:mb_form_factor", "mitx,matx,atx,eatx")
                .Annotation("Npgsql:Enum:pcie_generation", "gen3,gen4,gen5,gen6")
                .Annotation("Npgsql:Enum:pcie_orientation", "vertical,horizontal")
                .Annotation("Npgsql:Enum:pcie_slot_lane", "x1,x4,x8,x16")
                .Annotation("Npgsql:Enum:pcie_slot_type", "x1,x4,x8,x16")
                .Annotation("Npgsql:Enum:psu_cable_type", "motherboard24pin,cpu4plus4pin,pcie6plus2pin,pcie12v_high_power,pcie12v2x6,sata,molex,floppy")
                .Annotation("Npgsql:Enum:psu_form_factor", "flex_atx,tfx,sfx,sfx_l,atx")
                .Annotation("Npgsql:Enum:psu_modularity", "non_modular,semi_modular,full_modular")
                .Annotation("Npgsql:Enum:radiator_length", "mm120,mm140,mm240,mm280,mm360,mm420")
                .Annotation("Npgsql:Enum:radiator_mount_location", "front,top,bottom,rear,sides")
                .Annotation("Npgsql:Enum:ram_form_factor", "u_dimm,so_dimm")
                .Annotation("Npgsql:Enum:storage_form_factor", "m22230,m22242,m22260,m22280,m222110,sata25,sata35")
                .Annotation("Npgsql:Enum:storage_interface", "sata,nvme")
                .Annotation("Npgsql:Enum:storage_media", "hdd,ssd")
                .Annotation("Npgsql:Enum:wifi_standard", "wifi4,wifi5,wifi6,wifi6e,wifi7")
                .Annotation("Npgsql:Enum:wired_host_interface", "pcie,usb")
                .Annotation("Npgsql:Enum:wireless_host_interface", "m2,pcie,usb")
                .OldAnnotation("Npgsql:Enum:ddr_generation", "ddr4,ddr5")
                .OldAnnotation("Npgsql:Enum:m2_form_factor", "m22230,m22242,m22260,m22280,m222110")
                .OldAnnotation("Npgsql:Enum:mb_form_factor", "mitx,matx,atx,eatx")
                .OldAnnotation("Npgsql:Enum:pcie_generation", "gen3,gen4,gen5,gen6")
                .OldAnnotation("Npgsql:Enum:pcie_slot_lane", "x1,x4,x8,x16")
                .OldAnnotation("Npgsql:Enum:pcie_slot_type", "x1,x4,x8,x16")
                .OldAnnotation("Npgsql:Enum:psu_cable_type", "motherboard24pin,cpu4plus4pin,pcie6plus2pin,pcie12v_high_power,pcie12v2x6,sata,molex,floppy")
                .OldAnnotation("Npgsql:Enum:psu_form_factor", "flex_atx,tfx,sfx,sfx_l,atx")
                .OldAnnotation("Npgsql:Enum:psu_modularity", "non_modular,semi_modular,full_modular")
                .OldAnnotation("Npgsql:Enum:ram_form_factor", "u_dimm,so_dimm");

            migrationBuilder.Sql("ALTER TABLE \"WirelessNetworkAdapters\" ALTER COLUMN \"WifiStandard\" TYPE wifi_standard USING CASE \"WifiStandard\" WHEN 0 THEN 'wifi4' WHEN 1 THEN 'wifi5' WHEN 2 THEN 'wifi6' WHEN 3 THEN 'wifi6e' WHEN 4 THEN 'wifi7' END::wifi_standard;");

            migrationBuilder.Sql("ALTER TABLE \"WirelessNetworkAdapters\" ALTER COLUMN \"HostInterface\" TYPE wireless_host_interface USING CASE \"HostInterface\" WHEN 0 THEN 'm2' WHEN 1 THEN 'pcie' WHEN 2 THEN 'usb' END::wireless_host_interface;");

            migrationBuilder.Sql("ALTER TABLE \"WirelessNetworkAdapters\" ALTER COLUMN \"BluetoothVersion\" TYPE bluetooth_version USING CASE \"BluetoothVersion\" WHEN 0 THEN 'v5point0' WHEN 1 THEN 'v5point1' WHEN 2 THEN 'v5point2' WHEN 3 THEN 'v5point3' WHEN 4 THEN 'v5point4' ELSE NULL END::bluetooth_version;");

            migrationBuilder.Sql("ALTER TABLE \"WiredNetworkAdapters\" ALTER COLUMN \"HostInterface\" TYPE wired_host_interface USING CASE \"HostInterface\" WHEN 0 THEN 'pcie' WHEN 1 THEN 'usb' END::wired_host_interface;");

            migrationBuilder.Sql("ALTER TABLE \"StorageDrives\" ALTER COLUMN \"Media\" TYPE storage_media USING CASE \"Media\" WHEN 1 THEN 'hdd' WHEN 2 THEN 'ssd' END::storage_media;");

            migrationBuilder.Sql("ALTER TABLE \"StorageDrives\" ALTER COLUMN \"Interface\" TYPE storage_interface USING CASE \"Interface\" WHEN 1 THEN 'sata' WHEN 2 THEN 'nvme' END::storage_interface;");

            migrationBuilder.Sql("ALTER TABLE \"StorageDrives\" ALTER COLUMN \"FormFactor\" TYPE storage_form_factor USING CASE \"FormFactor\" WHEN 1 THEN 'm22230' WHEN 2 THEN 'm22242' WHEN 3 THEN 'm22260' WHEN 4 THEN 'm22280' WHEN 5 THEN 'm222110' WHEN 6 THEN 'sata25' WHEN 7 THEN 'sata35' END::storage_form_factor;");

            migrationBuilder.Sql("ALTER TABLE \"CpuCoolers\" ALTER COLUMN \"Type\" TYPE cpu_cooler_type USING CASE \"Type\" WHEN 1 THEN 'air' WHEN 2 THEN 'water' END::cpu_cooler_type;");

            migrationBuilder.Sql("ALTER TABLE \"CpuCoolers\" ALTER COLUMN \"RadiatorLength\" TYPE radiator_length USING CASE \"RadiatorLength\" WHEN 1 THEN 'mm120' WHEN 2 THEN 'mm140' WHEN 3 THEN 'mm240' WHEN 4 THEN 'mm280' WHEN 5 THEN 'mm360' WHEN 6 THEN 'mm420' ELSE NULL END::radiator_length;");

            migrationBuilder.Sql("ALTER TABLE \"ChassisRadiators\" ALTER COLUMN \"MountLocation\" TYPE radiator_mount_location USING CASE \"MountLocation\" WHEN 1 THEN 'front' WHEN 2 THEN 'top' WHEN 3 THEN 'bottom' WHEN 4 THEN 'rear' WHEN 5 THEN 'sides' END::radiator_mount_location;");

            migrationBuilder.Sql("ALTER TABLE \"ChassisRadiators\" ALTER COLUMN \"Length\" TYPE radiator_length USING CASE \"Length\" WHEN 1 THEN 'mm120' WHEN 2 THEN 'mm140' WHEN 3 THEN 'mm240' WHEN 4 THEN 'mm280' WHEN 5 THEN 'mm360' WHEN 6 THEN 'mm420' END::radiator_length;");

            migrationBuilder.Sql("ALTER TABLE \"ChassisPcieSlots\" ALTER COLUMN \"Orientation\" TYPE pcie_orientation USING CASE \"Orientation\" WHEN 1 THEN 'vertical' WHEN 2 THEN 'horizontal' END::pcie_orientation;");

            migrationBuilder.Sql("ALTER TABLE \"ChassisFans\" ALTER COLUMN \"DiameterMm\" TYPE fan_diameter_mm USING CASE \"DiameterMm\" WHEN 80 THEN 'mm80' WHEN 92 THEN 'mm92' WHEN 120 THEN 'mm120' WHEN 140 THEN 'mm140' WHEN 200 THEN 'mm200' END::fan_diameter_mm;");

            migrationBuilder.Sql("ALTER TABLE \"ChassisFanMounts\" ALTER COLUMN \"Location\" TYPE fan_mount_location USING CASE \"Location\" WHEN 1 THEN 'front' WHEN 2 THEN 'top' WHEN 3 THEN 'bottom' WHEN 4 THEN 'rear' WHEN 5 THEN 'sides' END::fan_mount_location;");

            migrationBuilder.Sql("ALTER TABLE \"ChassisFanMountOptions\" ALTER COLUMN \"Diameter\" TYPE fan_diameter_mm USING CASE \"Diameter\" WHEN 80 THEN 'mm80' WHEN 92 THEN 'mm92' WHEN 120 THEN 'mm120' WHEN 140 THEN 'mm140' WHEN 200 THEN 'mm200' END::fan_diameter_mm;");

            migrationBuilder.Sql("ALTER TABLE \"ChassisDriveBays\" ALTER COLUMN \"DriveBayFormFactor\" TYPE drive_bay_form_factor USING CASE \"DriveBayFormFactor\" WHEN 1 THEN 'inch25' WHEN 2 THEN 'inch35' WHEN 3 THEN 'inch525' END::drive_bay_form_factor;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .Annotation("Npgsql:Enum:ddr_generation", "ddr4,ddr5")
                .Annotation("Npgsql:Enum:m2_form_factor", "m22230,m22242,m22260,m22280,m222110")
                .Annotation("Npgsql:Enum:mb_form_factor", "mitx,matx,atx,eatx")
                .Annotation("Npgsql:Enum:pcie_generation", "gen3,gen4,gen5,gen6")
                .Annotation("Npgsql:Enum:pcie_slot_lane", "x1,x4,x8,x16")
                .Annotation("Npgsql:Enum:pcie_slot_type", "x1,x4,x8,x16")
                .Annotation("Npgsql:Enum:psu_cable_type", "motherboard24pin,cpu4plus4pin,pcie6plus2pin,pcie12v_high_power,pcie12v2x6,sata,molex,floppy")
                .Annotation("Npgsql:Enum:psu_form_factor", "flex_atx,tfx,sfx,sfx_l,atx")
                .Annotation("Npgsql:Enum:psu_modularity", "non_modular,semi_modular,full_modular")
                .Annotation("Npgsql:Enum:ram_form_factor", "u_dimm,so_dimm")
                .OldAnnotation("Npgsql:Enum:bluetooth_version", "v5point0,v5point1,v5point2,v5point3,v5point4")
                .OldAnnotation("Npgsql:Enum:cpu_cooler_type", "air,water")
                .OldAnnotation("Npgsql:Enum:ddr_generation", "ddr4,ddr5")
                .OldAnnotation("Npgsql:Enum:drive_bay_form_factor", "inch25,inch35,inch525")
                .OldAnnotation("Npgsql:Enum:fan_diameter_mm", "mm80,mm92,mm120,mm140,mm200")
                .OldAnnotation("Npgsql:Enum:fan_mount_location", "front,top,bottom,rear,sides")
                .OldAnnotation("Npgsql:Enum:m2_form_factor", "m22230,m22242,m22260,m22280,m222110")
                .OldAnnotation("Npgsql:Enum:mb_form_factor", "mitx,matx,atx,eatx")
                .OldAnnotation("Npgsql:Enum:pcie_generation", "gen3,gen4,gen5,gen6")
                .OldAnnotation("Npgsql:Enum:pcie_orientation", "vertical,horizontal")
                .OldAnnotation("Npgsql:Enum:pcie_slot_lane", "x1,x4,x8,x16")
                .OldAnnotation("Npgsql:Enum:pcie_slot_type", "x1,x4,x8,x16")
                .OldAnnotation("Npgsql:Enum:psu_cable_type", "motherboard24pin,cpu4plus4pin,pcie6plus2pin,pcie12v_high_power,pcie12v2x6,sata,molex,floppy")
                .OldAnnotation("Npgsql:Enum:psu_form_factor", "flex_atx,tfx,sfx,sfx_l,atx")
                .OldAnnotation("Npgsql:Enum:psu_modularity", "non_modular,semi_modular,full_modular")
                .OldAnnotation("Npgsql:Enum:radiator_length", "mm120,mm140,mm240,mm280,mm360,mm420")
                .OldAnnotation("Npgsql:Enum:radiator_mount_location", "front,top,bottom,rear,sides")
                .OldAnnotation("Npgsql:Enum:ram_form_factor", "u_dimm,so_dimm")
                .OldAnnotation("Npgsql:Enum:storage_form_factor", "m22230,m22242,m22260,m22280,m222110,sata25,sata35")
                .OldAnnotation("Npgsql:Enum:storage_interface", "sata,nvme")
                .OldAnnotation("Npgsql:Enum:storage_media", "hdd,ssd")
                .OldAnnotation("Npgsql:Enum:wifi_standard", "wifi4,wifi5,wifi6,wifi6e,wifi7")
                .OldAnnotation("Npgsql:Enum:wired_host_interface", "pcie,usb")
                .OldAnnotation("Npgsql:Enum:wireless_host_interface", "m2,pcie,usb");

            migrationBuilder.AlterColumn<int>(
                name: "WifiStandard",
                table: "WirelessNetworkAdapters",
                type: "integer",
                nullable: false,
                oldClrType: typeof(WifiStandard),
                oldType: "wifi_standard");

            migrationBuilder.AlterColumn<int>(
                name: "HostInterface",
                table: "WirelessNetworkAdapters",
                type: "integer",
                nullable: false,
                oldClrType: typeof(WirelessHostInterface),
                oldType: "wireless_host_interface");

            migrationBuilder.AlterColumn<int>(
                name: "BluetoothVersion",
                table: "WirelessNetworkAdapters",
                type: "integer",
                nullable: true,
                oldClrType: typeof(BluetoothVersion),
                oldType: "bluetooth_version",
                oldNullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "HostInterface",
                table: "WiredNetworkAdapters",
                type: "integer",
                nullable: false,
                oldClrType: typeof(WiredHostInterface),
                oldType: "wired_host_interface");

            migrationBuilder.AlterColumn<int>(
                name: "Media",
                table: "StorageDrives",
                type: "integer",
                nullable: false,
                oldClrType: typeof(StorageMedia),
                oldType: "storage_media");

            migrationBuilder.AlterColumn<int>(
                name: "Interface",
                table: "StorageDrives",
                type: "integer",
                nullable: false,
                oldClrType: typeof(StorageInterface),
                oldType: "storage_interface");

            migrationBuilder.AlterColumn<int>(
                name: "FormFactor",
                table: "StorageDrives",
                type: "integer",
                nullable: false,
                oldClrType: typeof(StorageFormFactor),
                oldType: "storage_form_factor");

            migrationBuilder.AlterColumn<int>(
                name: "Type",
                table: "CpuCoolers",
                type: "integer",
                nullable: false,
                oldClrType: typeof(CpuCoolerType),
                oldType: "cpu_cooler_type");

            migrationBuilder.AlterColumn<int>(
                name: "RadiatorLength",
                table: "CpuCoolers",
                type: "integer",
                nullable: true,
                oldClrType: typeof(RadiatorClass),
                oldType: "radiator_length",
                oldNullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "MountLocation",
                table: "ChassisRadiators",
                type: "integer",
                nullable: false,
                oldClrType: typeof(RadiatorMountLocation),
                oldType: "radiator_mount_location");

            migrationBuilder.AlterColumn<int>(
                name: "Length",
                table: "ChassisRadiators",
                type: "integer",
                nullable: false,
                oldClrType: typeof(RadiatorClass),
                oldType: "radiator_length");

            migrationBuilder.AlterColumn<int>(
                name: "Orientation",
                table: "ChassisPcieSlots",
                type: "integer",
                nullable: false,
                oldClrType: typeof(PcieOrientation),
                oldType: "pcie_orientation");

            migrationBuilder.AlterColumn<int>(
                name: "DiameterMm",
                table: "ChassisFans",
                type: "integer",
                nullable: false,
                oldClrType: typeof(FanDiameterMm),
                oldType: "fan_diameter_mm");

            migrationBuilder.AlterColumn<int>(
                name: "Location",
                table: "ChassisFanMounts",
                type: "integer",
                nullable: false,
                oldClrType: typeof(FanMountLocation),
                oldType: "fan_mount_location");

            migrationBuilder.AlterColumn<int>(
                name: "Diameter",
                table: "ChassisFanMountOptions",
                type: "integer",
                nullable: false,
                oldClrType: typeof(FanDiameterMm),
                oldType: "fan_diameter_mm");

            migrationBuilder.AlterColumn<int>(
                name: "DriveBayFormFactor",
                table: "ChassisDriveBays",
                type: "integer",
                nullable: false,
                oldClrType: typeof(DriveBayFormFactor),
                oldType: "drive_bay_form_factor");
        }
    }
}
