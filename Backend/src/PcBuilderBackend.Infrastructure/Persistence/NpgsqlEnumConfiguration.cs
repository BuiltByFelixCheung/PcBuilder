using Microsoft.EntityFrameworkCore;
using Npgsql.EntityFrameworkCore.PostgreSQL.Infrastructure;
using PcBuilderBackend.Domain.Enums;

namespace PcBuilderBackend.Infrastructure.Persistence;

internal static class NpgsqlEnumConfiguration
{
    public static void MapDomainEnums(this NpgsqlDbContextOptionsBuilder options)
    {
        options.MapEnum<DdrGeneration>("ddr_generation");
        options.MapEnum<MbFormFactor>("mb_form_factor");
        options.MapEnum<PcieGeneration>("pcie_generation");
        options.MapEnum<PcieSlotLane>("pcie_slot_lane");
        options.MapEnum<PcieSlotType>("pcie_slot_type");
        options.MapEnum<PcieOrientation>("pcie_orientation");
        options.MapEnum<PsuCableType>("psu_cable_type");
        options.MapEnum<PsuFormFactor>("psu_form_factor");
        options.MapEnum<PsuModularity>("psu_modularity");
        options.MapEnum<RamFormFactor>("ram_form_factor");
        options.MapEnum<M2FormFactor>("m2_form_factor");
        options.MapEnum<M2Key>("m2_key");
        options.MapEnum<BluetoothVersion>("bluetooth_version");
        options.MapEnum<CpuCoolerType>("cpu_cooler_type");
        options.MapEnum<DriveBayFormFactor>("drive_bay_form_factor");
        options.MapEnum<FanDiameterMm>("fan_diameter_mm");
        options.MapEnum<FanMountLocation>("fan_mount_location");
        options.MapEnum<RadiatorClass>("radiator_class");
        options.MapEnum<RadiatorMountLocation>("radiator_mount_location");
        options.MapEnum<StorageFormFactor>("storage_form_factor");
        options.MapEnum<StorageInterface>("storage_interface");
        options.MapEnum<StorageMedia>("storage_media");
        options.MapEnum<WifiStandard>("wifi_standard");
        options.MapEnum<WirelessHostInterface>("wireless_host_interface");
        options.MapEnum<WiredHostInterface>("wired_host_interface");
        options.MapEnum<RamRank>("ram_rank");
        options.MapEnum<UsbVersion>("usb_version");
        options.MapEnum<UsbType>("usb_type");
        options.MapEnum<PcBuildPartType>("pc_build_part_type");
        options.MapEnum<ProductType>("product_type");
    }

    public static void ConfigurePostgresEnums(this ModelBuilder modelBuilder)
    {
        modelBuilder.HasPostgresEnum<DdrGeneration>(name: "ddr_generation");
        modelBuilder.HasPostgresEnum<MbFormFactor>(name: "mb_form_factor");
        modelBuilder.HasPostgresEnum<PcieGeneration>(name: "pcie_generation");
        modelBuilder.HasPostgresEnum<PcieSlotLane>(name: "pcie_slot_lane");
        modelBuilder.HasPostgresEnum<PcieSlotType>(name: "pcie_slot_type");
        modelBuilder.HasPostgresEnum<PcieOrientation>(name: "pcie_orientation");
        modelBuilder.HasPostgresEnum<PsuCableType>(name: "psu_cable_type");
        modelBuilder.HasPostgresEnum<PsuFormFactor>(name: "psu_form_factor");
        modelBuilder.HasPostgresEnum<PsuModularity>(name: "psu_modularity");
        modelBuilder.HasPostgresEnum<RamFormFactor>(name: "ram_form_factor");
        modelBuilder.HasPostgresEnum<M2FormFactor>(name: "m2_form_factor");
        modelBuilder.HasPostgresEnum<M2Key>(name: "m2_key");
        modelBuilder.HasPostgresEnum<BluetoothVersion>(name: "bluetooth_version");
        modelBuilder.HasPostgresEnum<CpuCoolerType>(name: "cpu_cooler_type");
        modelBuilder.HasPostgresEnum<DriveBayFormFactor>(name: "drive_bay_form_factor");
        modelBuilder.HasPostgresEnum<FanDiameterMm>(name: "fan_diameter_mm");
        modelBuilder.HasPostgresEnum<FanMountLocation>(name: "fan_mount_location");
        modelBuilder.HasPostgresEnum<RadiatorClass>(name: "radiator_class");
        modelBuilder.HasPostgresEnum<RadiatorMountLocation>(name: "radiator_mount_location");
        modelBuilder.HasPostgresEnum<StorageFormFactor>(name: "storage_form_factor");
        modelBuilder.HasPostgresEnum<StorageInterface>(name: "storage_interface");
        modelBuilder.HasPostgresEnum<StorageMedia>(name: "storage_media");
        modelBuilder.HasPostgresEnum<WifiStandard>(name: "wifi_standard");
        modelBuilder.HasPostgresEnum<WirelessHostInterface>(name: "wireless_host_interface");
        modelBuilder.HasPostgresEnum<WiredHostInterface>(name: "wired_host_interface");
        modelBuilder.HasPostgresEnum<RamRank>(name: "ram_rank");
        modelBuilder.HasPostgresEnum<UsbVersion>(name: "usb_version");
        modelBuilder.HasPostgresEnum<UsbType>(name: "usb_type");
        modelBuilder.HasPostgresEnum<PcBuildPartType>(name: "pc_build_part_type");
        modelBuilder.HasPostgresEnum<ProductType>(name: "product_type");
    }
}