using FluentAssertions;
using PcBuilderBackend.Application.Build.Commands.CreatePcBuild;
using PcBuilderBackend.Application.Build.Commands.UpdatePcBuild;
using PcBuilderBackend.Application.Build.Dto;
using PcBuilderBackend.Application.Build.Validators;
using PcBuilderBackend.Application.Catalog.Chassis.Commands.CreateChassis;
using PcBuilderBackend.Application.Catalog.Chassis.Dto;
using PcBuilderBackend.Application.Catalog.Chassis.Validators;
using PcBuilderBackend.Application.Catalog.ChassisFans.Commands.CreateChassisFan;
using PcBuilderBackend.Application.Catalog.ChassisFans.Validators;
using PcBuilderBackend.Application.Catalog.CpuCoolers.Commands.CreateCpuCooler;
using PcBuilderBackend.Application.Catalog.CpuCoolers.Dto;
using PcBuilderBackend.Application.Catalog.CpuCoolers.Validators;
using PcBuilderBackend.Application.Catalog.WirelessNetworkAdapters.Commands.CreateWirelessNetworkAdapter;
using PcBuilderBackend.Application.Catalog.WirelessNetworkAdapters.Commands.UpdateWirelessNetworkAdapter;
using PcBuilderBackend.Application.Catalog.WirelessNetworkAdapters.Validators;
using PcBuilderBackend.Application.UnitTests.Support;
using PcBuilderBackend.Domain.Enums;

namespace PcBuilderBackend.Application.UnitTests.Catalog;

public class CatalogFieldValidatorTests : IDisposable
{
    private readonly AppFixture _fx = new();

    public void Dispose()
    {
        Dispose(true);
        GC.SuppressFinalize(this);
    }

    protected virtual void Dispose(bool disposing)
    {
        if (disposing)
            _fx.Dispose();
    }

    [Fact]
    public async Task Wireless_adapter_accepts_m2_pcie_and_usb_host_interfaces()
    {
        var validator = new CreateWirelessNetworkAdapterCommandValidator(_fx.Lookup);

        (await validator.ValidateAsync(Wireless(WirelessHostInterface.M2, key: M2Key.E, form: M2FormFactor.M22230)))
            .IsValid.Should().BeTrue();
        (await validator.ValidateAsync(Wireless(WirelessHostInterface.Pcie, slot: PcieSlotType.X1)))
            .IsValid.Should().BeTrue();
        (await validator.ValidateAsync(Wireless(WirelessHostInterface.Usb, usbVersion: UsbVersion.Usb20, usbType: UsbType.TypeA)))
            .IsValid.Should().BeTrue();
    }

    [Fact]
    public async Task Wireless_adapter_rejects_fields_that_do_not_match_the_host_interface()
    {
        var validator = new CreateWirelessNetworkAdapterCommandValidator(_fx.Lookup);

        (await validator.ValidateAsync(Wireless(WirelessHostInterface.M2, key: M2Key.M, slot: PcieSlotType.X1)))
            .IsValid.Should().BeFalse();
        (await validator.ValidateAsync(Wireless(WirelessHostInterface.Pcie, key: M2Key.E, usbVersion: UsbVersion.Usb20)))
            .IsValid.Should().BeFalse();
        (await validator.ValidateAsync(Wireless(WirelessHostInterface.Usb, slot: PcieSlotType.X1, key: M2Key.E)))
            .IsValid.Should().BeFalse();
        (await validator.ValidateAsync(Wireless(WirelessHostInterface.Pcie, slot: PcieSlotType.X1) with
        {
            MaxSpeedMbps5G = 0,
            MaxSpeedMbps6G = 0,
            BluetoothVersion = (BluetoothVersion)99
        })).IsValid.Should().BeFalse();

        var update = new UpdateWirelessNetworkAdapterCommand
        {
            Id = Guid.NewGuid(),
            Name = "Wi-Fi card",
            ManufacturerId = _fx.Manufacturer.Id,
            WifiStandard = WifiStandard.Wifi6E,
            HostInterface = WirelessHostInterface.Pcie,
            MaxSpeedMbps = 2400,
            PcieSlotType = PcieSlotType.X1
        };
        (await new UpdateWirelessNetworkAdapterCommandValidator().ValidateAsync(update))
            .IsValid.Should().BeTrue();
        (await new UpdateWirelessNetworkAdapterCommandValidator().ValidateAsync(update with { Id = Guid.Empty }))
            .IsValid.Should().BeFalse();
    }

    [Fact]
    public async Task Cpu_cooler_validates_air_and_water_specific_fields()
    {
        var validator = new CreateCpuCoolerCommandValidator(_fx.Lookup);
        var sockets = new List<CpuCoolerSocketDto> { new(_fx.Socket.Id, _fx.Socket.Name) };

        var air = Cooler(CpuCoolerType.Air, sockets, height: 158, ramHeight: 32);
        (await validator.ValidateAsync(air)).IsValid.Should().BeTrue();
        (await validator.ValidateAsync(air with { RadiatorClass = RadiatorClass.Mm240 }))
            .IsValid.Should().BeFalse();

        var water = Cooler(CpuCoolerType.Water, sockets, radiator: RadiatorClass.Mm240);
        (await validator.ValidateAsync(water)).IsValid.Should().BeTrue();
        (await validator.ValidateAsync(water with { CoolerHeightMm = 40, MaxRamHeightMm = 32 }))
            .IsValid.Should().BeFalse();
    }

    [Fact]
    public async Task Chassis_fan_requires_name_diameter_and_pack_count()
    {
        var validator = new CreateChassisFanCommandValidator(_fx.Lookup);
        var command = new CreateChassisFanCommand
        {
            Name = "LL120",
            ManufacturerId = _fx.Manufacturer.Id,
            DiameterMm = FanDiameterMm.Mm120,
            FansCountPerPack = 3
        };

        (await validator.ValidateAsync(command)).IsValid.Should().BeTrue();
        (await validator.ValidateAsync(command with { Name = "", FansCountPerPack = 0 }))
            .IsValid.Should().BeFalse();
    }

    [Fact]
    public async Task Chassis_rejects_duplicate_pcie_slots_and_radiators()
    {
        var validator = new CreateChassisCommandValidator(_fx.Lookup);
        var unique = Chassis() with
        {
            PcieSlots = [new ChassisPcieSlotDto(false, 3, PcieOrientation.Horizontal)],
            Radiators = [new ChassisRadiatorDto { Length = RadiatorClass.Mm360, Location = RadiatorMountLocation.Top, RadiatorCount = 1 }]
        };
        (await validator.ValidateAsync(unique)).IsValid.Should().BeTrue();

        var duplicatePcie = unique with
        {
            PcieSlots =
            [
                new ChassisPcieSlotDto(false, 1, PcieOrientation.Horizontal),
                new ChassisPcieSlotDto(false, 2, PcieOrientation.Horizontal)
            ]
        };
        (await validator.ValidateAsync(duplicatePcie)).IsValid.Should().BeFalse();

        var duplicateRadiator = unique with
        {
            Radiators =
            [
                new ChassisRadiatorDto { Length = RadiatorClass.Mm360, Location = RadiatorMountLocation.Top, RadiatorCount = 1 },
                new ChassisRadiatorDto { Length = RadiatorClass.Mm360, Location = RadiatorMountLocation.Top, RadiatorCount = 2 }
            ]
        };
        (await validator.ValidateAsync(duplicateRadiator)).IsValid.Should().BeFalse();
    }

    [Fact]
    public async Task Pc_build_validates_required_parts_and_quantities()
    {
        var validator = new CreatePcBuildCommandValidator();
        var valid = new CreatePcBuildCommand(
            "My build",
            "Quiet",
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            null,
            Guid.NewGuid(),
            null,
            Guid.NewGuid(),
            [new PcBuildPartDto(PcBuildPartType.ChassisFan, Guid.NewGuid(), 2)],
            [new PcBuildPartDto(PcBuildPartType.StorageDrive, Guid.NewGuid(), 1)],
            [new PcBuildPartDto(PcBuildPartType.WiredNetworkAdapter, Guid.NewGuid(), 1)],
            [new PcBuildPartDto(PcBuildPartType.WirelessNetworkAdapter, Guid.NewGuid(), 1)]);

        (await validator.ValidateAsync(valid)).IsValid.Should().BeTrue();
        (await validator.ValidateAsync(valid with { Name = "" })).IsValid.Should().BeFalse();
        (await validator.ValidateAsync(valid with
        {
            ChassisFans = [new PcBuildPartDto(PcBuildPartType.StorageDrive, Guid.Empty, 0)]
        })).IsValid.Should().BeFalse();

        var update = new UpdatePcBuildCommand(
            Guid.NewGuid(),
            valid.Name,
            valid.Description,
            true,
            valid.ChassisId,
            valid.MotherboardId,
            valid.CpuId,
            valid.CpuCoolerId,
            valid.RamKitId,
            valid.GraphicsCardId,
            valid.PsuId,
            valid.ChassisFans,
            valid.StorageDevices,
            valid.WiredNetworkAdapters,
            valid.WirelessNetworkAdapters);
        (await new UpdatePcBuildCommandValidator().ValidateAsync(update)).IsValid.Should().BeTrue();
        (await new UpdatePcBuildCommandValidator().ValidateAsync(update with { Id = Guid.Empty }))
            .IsValid.Should().BeFalse();
    }

    private CreateWirelessNetworkAdapterCommand Wireless(
        WirelessHostInterface host,
        M2Key? key = null,
        M2FormFactor? form = null,
        PcieSlotType? slot = null,
        UsbVersion? usbVersion = null,
        UsbType? usbType = null) =>
        new()
        {
            Name = "Wi-Fi card",
            ManufacturerId = _fx.Manufacturer.Id,
            WifiStandard = WifiStandard.Wifi6E,
            HostInterface = host,
            MaxSpeedMbps = 2400,
            MaxSpeedMbps5G = 1200,
            BluetoothVersion = BluetoothVersion.V5Point3,
            Key = key,
            M2FormFactor = form,
            PcieSlotType = slot,
            UsbVersion = usbVersion,
            UsbType = usbType
        };

    private CreateCpuCoolerCommand Cooler(
        CpuCoolerType type,
        List<CpuCoolerSocketDto> sockets,
        decimal? height = null,
        decimal? ramHeight = null,
        RadiatorClass? radiator = null) =>
        new()
        {
            Name = "Cooler",
            ManufacturerId = _fx.Manufacturer.Id,
            Type = type,
            CoolerHeightMm = height,
            MaxRamHeightMm = ramHeight,
            RadiatorClass = radiator,
            Sockets = sockets
        };

    private CreateChassisCommand Chassis() =>
        new()
        {
            Name = "4000D",
            ManufacturerId = _fx.Manufacturer.Id,
            LengthMm = 450,
            WidthMm = 230,
            HeightMm = 460,
            MotherboardMaxWidthMm = 305,
            MotherboardMaxHeightMm = 244,
            MaxCpuCoolerHeightMm = 170,
            MaxGraphicsCardLengthMm = 370,
            MaxPsuLengthMm = 180
        };
}
