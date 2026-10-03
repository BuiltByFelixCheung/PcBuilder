using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;
using PcBuilderBackend.Domain.Enums;

#nullable disable

namespace PcBuilderBackend.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddManufacturerProductTypes : Migration
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
                .Annotation("Npgsql:Enum:m2_key", "m,b,e,bm")
                .Annotation("Npgsql:Enum:mb_form_factor", "mitx,matx,atx,eatx")
                .Annotation("Npgsql:Enum:pc_build_part_type", "storage_drive,chassis_fan,wired_network_adapter,wireless_network_adapter")
                .Annotation("Npgsql:Enum:pcie_generation", "gen3,gen4,gen5,gen6")
                .Annotation("Npgsql:Enum:pcie_orientation", "vertical,horizontal")
                .Annotation("Npgsql:Enum:pcie_slot_lane", "x1,x4,x8,x16")
                .Annotation("Npgsql:Enum:pcie_slot_type", "x1,x4,x8,x16")
                .Annotation("Npgsql:Enum:product_type", "chassis,chassis_fan,chipset,cpu,cpu_cooler,cpu_series,gpu,gpu_series,graphics_card,motherboard,psu,ram,socket,storage_drive,wired_network_adapter,wireless_network_adapter")
                .Annotation("Npgsql:Enum:psu_cable_type", "motherboard24pin,cpu4plus4pin,pcie6plus2pin,pcie12v_high_power,pcie12v2x6,sata,molex,floppy")
                .Annotation("Npgsql:Enum:psu_form_factor", "flex_atx,tfx,sfx,sfx_l,atx")
                .Annotation("Npgsql:Enum:psu_modularity", "non_modular,semi_modular,full_modular")
                .Annotation("Npgsql:Enum:radiator_length", "mm120,mm140,mm240,mm280,mm360,mm420")
                .Annotation("Npgsql:Enum:radiator_mount_location", "front,top,bottom,rear,sides")
                .Annotation("Npgsql:Enum:ram_form_factor", "u_dimm,so_dimm")
                .Annotation("Npgsql:Enum:ram_rank", "single_rank,dual_rank")
                .Annotation("Npgsql:Enum:storage_form_factor", "m22230,m22242,m22260,m22280,m222110,sata25,sata35")
                .Annotation("Npgsql:Enum:storage_interface", "sata,nvme")
                .Annotation("Npgsql:Enum:storage_media", "hdd,ssd")
                .Annotation("Npgsql:Enum:usb_type", "type_a,type_c")
                .Annotation("Npgsql:Enum:usb_version", "usb20,usb32gen1,usb32gen2,usb4")
                .Annotation("Npgsql:Enum:wifi_standard", "wifi4,wifi5,wifi6,wifi6e,wifi7")
                .Annotation("Npgsql:Enum:wired_host_interface", "pcie,usb")
                .Annotation("Npgsql:Enum:wireless_host_interface", "m2,pcie,usb")
                .OldAnnotation("Npgsql:Enum:bluetooth_version", "v5point0,v5point1,v5point2,v5point3,v5point4")
                .OldAnnotation("Npgsql:Enum:cpu_cooler_type", "air,water")
                .OldAnnotation("Npgsql:Enum:ddr_generation", "ddr4,ddr5")
                .OldAnnotation("Npgsql:Enum:drive_bay_form_factor", "inch25,inch35,inch525")
                .OldAnnotation("Npgsql:Enum:fan_diameter_mm", "mm80,mm92,mm120,mm140,mm200")
                .OldAnnotation("Npgsql:Enum:fan_mount_location", "front,top,bottom,rear,sides")
                .OldAnnotation("Npgsql:Enum:m2_form_factor", "m22230,m22242,m22260,m22280,m222110")
                .OldAnnotation("Npgsql:Enum:m2_key", "m,b,e,bm")
                .OldAnnotation("Npgsql:Enum:mb_form_factor", "mitx,matx,atx,eatx")
                .OldAnnotation("Npgsql:Enum:pc_build_part_type", "storage_drive,chassis_fan,wired_network_adapter,wireless_network_adapter")
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
                .OldAnnotation("Npgsql:Enum:ram_rank", "single_rank,dual_rank")
                .OldAnnotation("Npgsql:Enum:storage_form_factor", "m22230,m22242,m22260,m22280,m222110,sata25,sata35")
                .OldAnnotation("Npgsql:Enum:storage_interface", "sata,nvme")
                .OldAnnotation("Npgsql:Enum:storage_media", "hdd,ssd")
                .OldAnnotation("Npgsql:Enum:usb_type", "type_a,type_c")
                .OldAnnotation("Npgsql:Enum:usb_version", "usb20,usb32gen1,usb32gen2,usb4")
                .OldAnnotation("Npgsql:Enum:wifi_standard", "wifi4,wifi5,wifi6,wifi6e,wifi7")
                .OldAnnotation("Npgsql:Enum:wired_host_interface", "pcie,usb")
                .OldAnnotation("Npgsql:Enum:wireless_host_interface", "m2,pcie,usb");

            migrationBuilder.AddColumn<List<ProductType>>(
                name: "ProductTypes",
                table: "Manufacturers",
                type: "product_type[]",
                nullable: false,
                defaultValueSql: "'{}'");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ProductTypes",
                table: "Manufacturers");

            migrationBuilder.AlterDatabase()
                .Annotation("Npgsql:Enum:bluetooth_version", "v5point0,v5point1,v5point2,v5point3,v5point4")
                .Annotation("Npgsql:Enum:cpu_cooler_type", "air,water")
                .Annotation("Npgsql:Enum:ddr_generation", "ddr4,ddr5")
                .Annotation("Npgsql:Enum:drive_bay_form_factor", "inch25,inch35,inch525")
                .Annotation("Npgsql:Enum:fan_diameter_mm", "mm80,mm92,mm120,mm140,mm200")
                .Annotation("Npgsql:Enum:fan_mount_location", "front,top,bottom,rear,sides")
                .Annotation("Npgsql:Enum:m2_form_factor", "m22230,m22242,m22260,m22280,m222110")
                .Annotation("Npgsql:Enum:m2_key", "m,b,e,bm")
                .Annotation("Npgsql:Enum:mb_form_factor", "mitx,matx,atx,eatx")
                .Annotation("Npgsql:Enum:pc_build_part_type", "storage_drive,chassis_fan,wired_network_adapter,wireless_network_adapter")
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
                .Annotation("Npgsql:Enum:ram_rank", "single_rank,dual_rank")
                .Annotation("Npgsql:Enum:storage_form_factor", "m22230,m22242,m22260,m22280,m222110,sata25,sata35")
                .Annotation("Npgsql:Enum:storage_interface", "sata,nvme")
                .Annotation("Npgsql:Enum:storage_media", "hdd,ssd")
                .Annotation("Npgsql:Enum:usb_type", "type_a,type_c")
                .Annotation("Npgsql:Enum:usb_version", "usb20,usb32gen1,usb32gen2,usb4")
                .Annotation("Npgsql:Enum:wifi_standard", "wifi4,wifi5,wifi6,wifi6e,wifi7")
                .Annotation("Npgsql:Enum:wired_host_interface", "pcie,usb")
                .Annotation("Npgsql:Enum:wireless_host_interface", "m2,pcie,usb")
                .OldAnnotation("Npgsql:Enum:bluetooth_version", "v5point0,v5point1,v5point2,v5point3,v5point4")
                .OldAnnotation("Npgsql:Enum:cpu_cooler_type", "air,water")
                .OldAnnotation("Npgsql:Enum:ddr_generation", "ddr4,ddr5")
                .OldAnnotation("Npgsql:Enum:drive_bay_form_factor", "inch25,inch35,inch525")
                .OldAnnotation("Npgsql:Enum:fan_diameter_mm", "mm80,mm92,mm120,mm140,mm200")
                .OldAnnotation("Npgsql:Enum:fan_mount_location", "front,top,bottom,rear,sides")
                .OldAnnotation("Npgsql:Enum:m2_form_factor", "m22230,m22242,m22260,m22280,m222110")
                .OldAnnotation("Npgsql:Enum:m2_key", "m,b,e,bm")
                .OldAnnotation("Npgsql:Enum:mb_form_factor", "mitx,matx,atx,eatx")
                .OldAnnotation("Npgsql:Enum:pc_build_part_type", "storage_drive,chassis_fan,wired_network_adapter,wireless_network_adapter")
                .OldAnnotation("Npgsql:Enum:pcie_generation", "gen3,gen4,gen5,gen6")
                .OldAnnotation("Npgsql:Enum:pcie_orientation", "vertical,horizontal")
                .OldAnnotation("Npgsql:Enum:pcie_slot_lane", "x1,x4,x8,x16")
                .OldAnnotation("Npgsql:Enum:pcie_slot_type", "x1,x4,x8,x16")
                .OldAnnotation("Npgsql:Enum:product_type", "chassis,chassis_fan,chipset,cpu,cpu_cooler,cpu_series,gpu,gpu_series,graphics_card,motherboard,psu,ram,socket,storage_drive,wired_network_adapter,wireless_network_adapter")
                .OldAnnotation("Npgsql:Enum:psu_cable_type", "motherboard24pin,cpu4plus4pin,pcie6plus2pin,pcie12v_high_power,pcie12v2x6,sata,molex,floppy")
                .OldAnnotation("Npgsql:Enum:psu_form_factor", "flex_atx,tfx,sfx,sfx_l,atx")
                .OldAnnotation("Npgsql:Enum:psu_modularity", "non_modular,semi_modular,full_modular")
                .OldAnnotation("Npgsql:Enum:radiator_length", "mm120,mm140,mm240,mm280,mm360,mm420")
                .OldAnnotation("Npgsql:Enum:radiator_mount_location", "front,top,bottom,rear,sides")
                .OldAnnotation("Npgsql:Enum:ram_form_factor", "u_dimm,so_dimm")
                .OldAnnotation("Npgsql:Enum:ram_rank", "single_rank,dual_rank")
                .OldAnnotation("Npgsql:Enum:storage_form_factor", "m22230,m22242,m22260,m22280,m222110,sata25,sata35")
                .OldAnnotation("Npgsql:Enum:storage_interface", "sata,nvme")
                .OldAnnotation("Npgsql:Enum:storage_media", "hdd,ssd")
                .OldAnnotation("Npgsql:Enum:usb_type", "type_a,type_c")
                .OldAnnotation("Npgsql:Enum:usb_version", "usb20,usb32gen1,usb32gen2,usb4")
                .OldAnnotation("Npgsql:Enum:wifi_standard", "wifi4,wifi5,wifi6,wifi6e,wifi7")
                .OldAnnotation("Npgsql:Enum:wired_host_interface", "pcie,usb")
                .OldAnnotation("Npgsql:Enum:wireless_host_interface", "m2,pcie,usb");
        }
    }
}
