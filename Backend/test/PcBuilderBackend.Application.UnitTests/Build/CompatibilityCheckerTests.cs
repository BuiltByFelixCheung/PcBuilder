using FluentAssertions;
using PcBuilderBackend.Application.Build;
using PcBuilderBackend.Application.Build.Dto;
using PcBuilderBackend.Application.Common.Interfaces;
using PcBuilderBackend.Domain.Entities;
using PcBuilderBackend.Domain.Enums;
using PcBuilderBackend.Domain.ValueObjects;

namespace PcBuilderBackend.Application.UnitTests.Build;

public class CompatibilityCheckerTests
{
    private static readonly Guid ManufacturerId = Guid.NewGuid();

    [Fact]
    public async Task Unknown_part_id_throws()
    {
        var checker = new CompatibilityChecker(new FakeCatalog());

        var act = () => checker.CheckCompatibilityAsync(
            new CompatibilityCheckRequest
            {
                ChassisId = null,
                MotherboardId = null,
                CpuId = null,
                CpuCoolerId = null,
                RamKitId = null,
                GraphicsCardId = null,
                PsuId = null,
                ChassisFans = [],
                StorageDevices = [new PcBuildPartDto(PcBuildPartType.StorageDrive, Guid.NewGuid(), 1)],
                WiredNetworkAdapters = [],
                WirelessNetworkAdapters = []
            });

        await act.Should().ThrowAsync<ArgumentException>();
    }

    [Fact]
    public async Task Unknown_single_part_id_throws()
    {
        var checker = new CompatibilityChecker(new FakeCatalog());

        var act = () => checker.CheckCompatibilityAsync(
            new CompatibilityCheckRequest
            {
                ChassisId = Guid.NewGuid(),
                MotherboardId = null,
                CpuId = null,
                CpuCoolerId = null,
                RamKitId = null,
                GraphicsCardId = null,
                PsuId = null,
                ChassisFans = [],
                StorageDevices = [],
                WiredNetworkAdapters = [],
                WirelessNetworkAdapters = []
            });

        await act.Should().ThrowAsync<ArgumentException>();
    }

    [Fact]
    public async Task Storage_within_sata_port_count_is_compatible()
    {
        var catalog = new FakeCatalog();
        var board = CreateMotherboard(sataPorts: 2);
        catalog.Motherboards[board.Id] = board;
        var ssd = new StorageDrive("MX500", ManufacturerId, new StorageDriveSpecs
        {
            Media = StorageMedia.Ssd,
            Interface = StorageInterface.Sata,
            FormFactor = StorageFormFactor.Sata25,
            CapacityGb = 1000
        });
        catalog.Drives[ssd.Id] = ssd;

        var checker = new CompatibilityChecker(catalog);
        var results = await checker.CheckCompatibilityAsync(
            new CompatibilityCheckRequest
            {
                MotherboardId = board.Id,
                ChassisFans = [],
                StorageDevices = [new PcBuildPartDto(PcBuildPartType.StorageDrive, ssd.Id, 2)],
                WiredNetworkAdapters = [],
                WirelessNetworkAdapters = []
            });

        results.Should().Contain(r => r.Result.Status == PartsCompatibility.Compatible);
        results.Should().NotContain(r => r.Result.Reason == CompatibilityReason.InsufficientSataPorts);
    }

    [Fact]
    public async Task Storage_quantity_consumes_sata_ports_and_names_motherboard_and_drives()
    {
        var catalog = new FakeCatalog();
        var board = CreateMotherboard(sataPorts: 1);
        catalog.Motherboards[board.Id] = board;
        var ssd = new StorageDrive("MX500", ManufacturerId, new StorageDriveSpecs
        {
            Media = StorageMedia.Ssd,
            Interface = StorageInterface.Sata,
            FormFactor = StorageFormFactor.Sata25,
            CapacityGb = 1000
        });
        catalog.Drives[ssd.Id] = ssd;

        var checker = new CompatibilityChecker(catalog);
        var results = await checker.CheckCompatibilityAsync(
            new CompatibilityCheckRequest
            {
                MotherboardId = board.Id,
                ChassisFans = [],
                StorageDevices = [new PcBuildPartDto(PcBuildPartType.StorageDrive, ssd.Id, 2)],
                WiredNetworkAdapters = [],
                WirelessNetworkAdapters = []
            });

        var issue = results.Should().ContainSingle(r => r.Result.Reason == CompatibilityReason.InsufficientSataPorts)
            .Subject;
        issue.Parts.Should().Contain(p => p.Slot == CompatibilitySlot.Motherboard && p.PartId == board.Id);
        issue.Parts.Should().Contain(p => p.Slot == CompatibilitySlot.StorageDevices && p.PartId == ssd.Id);
    }

    [Fact]
    public async Task Wired_and_wireless_usb_share_port_count()
    {
        var catalog = new FakeCatalog();
        var board = CreateMotherboard(sataPorts: 4);
        board.AddUsbPort(new MotherboardUsb(board.Id, UsbVersion.Usb32Gen1, UsbType.TypeA, 1));
        catalog.Motherboards[board.Id] = board;

        var wired = new WiredNetworkAdapter("USB NIC", ManufacturerId, WiredHostInterface.Usb, 1000,
            UsbVersion.Usb32Gen1, UsbType.TypeA);
        var wireless = new WirelessNetworkAdapter("USB WiFi", ManufacturerId, new WirelessNetworkAdapterSpecs
        {
            WifiStandard = WifiStandard.Wifi6,
            HostInterface = WirelessHostInterface.Usb,
            MaxSpeedMbps = 1200,
            MaxSpeedMbps5G = null,
            MaxSpeedMbps6G = null,
            BluetoothVersion = null,
            UsbVersion = UsbVersion.Usb32Gen1,
            UsbType = UsbType.TypeA
        });
        catalog.Wired[wired.Id] = wired;
        catalog.Wireless[wireless.Id] = wireless;

        var checker = new CompatibilityChecker(catalog);
        var results = await checker.CheckCompatibilityAsync(
            new CompatibilityCheckRequest
            {
                MotherboardId = board.Id,
                ChassisFans = [],
                StorageDevices = [],
                WiredNetworkAdapters = [new PcBuildPartDto(PcBuildPartType.WiredNetworkAdapter, wired.Id, 1)],
                WirelessNetworkAdapters = [new PcBuildPartDto(PcBuildPartType.WirelessNetworkAdapter, wireless.Id, 1)]
            });

        var issue = results.Should().ContainSingle(r => r.Result.Reason == CompatibilityReason.NoMatchingUsbPort)
            .Subject;
        issue.Parts.Should().Contain(p => p.Slot == CompatibilitySlot.Motherboard && p.PartId == board.Id);
        issue.Parts.Should().Contain(p => p.Slot == CompatibilitySlot.WiredNetworkAdapters && p.PartId == wired.Id);
        issue.Parts.Should().Contain(p =>
            p.Slot == CompatibilitySlot.WirelessNetworkAdapters && p.PartId == wireless.Id);
    }

    [Fact]
    public async Task Fan_quantity_is_expanded_before_chassis_check()
    {
        var catalog = new FakeCatalog();
        var chassis = new Chassis("Case", ManufacturerId, new ChassisSpecs
        {
            LengthMm = 400,
            WidthMm = 200,
            HeightMm = 400,
            MotherboardMaxWidthMm = 305,
            MotherboardMaxHeightMm = 244,
            MaxCpuCoolerHeightMm = 160,
            MaxGraphicsCardLengthMm = 320,
            MaxPsuLengthMm = 180
        });
        var mount = new ChassisFanMount(chassis.Id, FanMountLocation.Front, false);
        mount.AddOption(new ChassisFanMountOption(mount.Id, FanDiameterMm.Mm120, 3));
        chassis.AddFanMount(mount);
        catalog.Chassis[chassis.Id] = chassis;

        var fan = new ChassisFan(
            "LL120", ManufacturerId, FanDiameterMm.Mm120, 3, 25m, FanHeaderType.FourPinPwm, false, null);
        catalog.Fans[fan.Id] = fan;

        var checker = new CompatibilityChecker(catalog);
        var results = await checker.CheckCompatibilityAsync(
            new CompatibilityCheckRequest
            {
                ChassisId = chassis.Id,
                ChassisFans = [new PcBuildPartDto(PcBuildPartType.ChassisFan, fan.Id, 2)],
                StorageDevices = [],
                WiredNetworkAdapters = [],
                WirelessNetworkAdapters = []
            });

        var issue = results.Should().ContainSingle(r => r.Result.Status == PartsCompatibility.Incompatible).Subject;
        issue.Result.Reason.Should().Be(CompatibilityReason.PartSizeExceedsLimits);
        issue.Parts.Should().Contain(p => p.Slot == CompatibilitySlot.Chassis && p.PartId == chassis.Id);
        issue.Parts.Should().Contain(p => p.Slot == CompatibilitySlot.ChassisFans && p.PartId == fan.Id);
    }

    [Fact]
    public async Task Fan_headers_are_checked_against_motherboard()
    {
        var catalog = new FakeCatalog();
        var motherboard = CreateMotherboard(sataPorts: 4);
        motherboard.UpdateSpecs(new MotherboardSpecs
        {
            SocketId = motherboard.SocketId,
            ChipsetId = motherboard.ChipsetId,
            RamSlots = motherboard.RamSlots,
            MaxMemoryGb = motherboard.MaxMemoryGb,
            MaxDimmSizeGb = motherboard.MaxDimmSizeGb,
            SataPorts = motherboard.SataPorts,
            PwmFanHeaders = 1,
            DcFanHeaders = 0,
            EpsConnectors = motherboard.EpsConnectors,
            WidthMm = motherboard.WidthMm,
            HeightMm = motherboard.HeightMm,
            DdrGeneration = motherboard.DdrGeneration,
            RamFormFactor = motherboard.RamFormFactor,
            MbFormFactor = motherboard.FormFactor,
            WifiEnabled = motherboard.WifiEnabled,
            BluetoothEnabled = motherboard.BluetoothEnabled
        });
        catalog.Motherboards[motherboard.Id] = motherboard;

        var fan = new ChassisFan(
            "LL120", ManufacturerId, FanDiameterMm.Mm120, 3, 25m, FanHeaderType.FourPinPwm, false, null);
        catalog.Fans[fan.Id] = fan;

        var checker = new CompatibilityChecker(catalog);
        var results = await checker.CheckCompatibilityAsync(
            new CompatibilityCheckRequest
            {
                MotherboardId = motherboard.Id,
                ChassisFans = [new PcBuildPartDto(PcBuildPartType.ChassisFan, fan.Id, 1)],
                StorageDevices = [],
                WiredNetworkAdapters = [],
                WirelessNetworkAdapters = []
            });

        var issue = results.Should()
            .ContainSingle(r => r.Result.Reason == CompatibilityReason.InsufficientFanHeaders)
            .Subject;
        issue.Parts.Should().Contain(p => p.Slot == CompatibilitySlot.Motherboard && p.PartId == motherboard.Id);
        issue.Parts.Should().Contain(p => p.Slot == CompatibilitySlot.ChassisFans && p.PartId == fan.Id);
    }

    [Fact]
    public async Task Chassis_versus_graphics_card_names_graphics_card_slot()
    {
        var catalog = new FakeCatalog();
        var chassis = new Chassis("Case", ManufacturerId, new ChassisSpecs
        {
            LengthMm = 400,
            WidthMm = 200,
            HeightMm = 400,
            MotherboardMaxWidthMm = 305,
            MotherboardMaxHeightMm = 244,
            MaxCpuCoolerHeightMm = 160,
            MaxGraphicsCardLengthMm = 320,
            MaxPsuLengthMm = 180
        });
        chassis.AddPcieSlot(new ChassisPcieSlot(chassis.Id, lowProfileSlots: false, slotCount: 3,
            PcieOrientation.Horizontal));
        catalog.Chassis[chassis.Id] = chassis;

        var graphicsCard = new GraphicsCard(
            "Long card",
            ManufacturerId,
            new GraphicsCardSpecs
            {
                GpuId = Guid.NewGuid(),
                VideoMemoryGb = 12,
                PcieSlotsUsed = 2,
                PcieGeneration = PcieGeneration.Gen4,
                IsLowProfile = false,
                LengthMm = 400,
                WidthMm = 120,
                HeightMm = 50,
                PowerConsumptionWatts = 200,
                PowerConnectorType = PsuCableType.Pcie6Plus2Pin,
                PowerConnectorCount = 2
            });
        catalog.GraphicsCards[graphicsCard.Id] = graphicsCard;

        var checker = new CompatibilityChecker(catalog);
        var results = await checker.CheckCompatibilityAsync(
            new CompatibilityCheckRequest
            {
                ChassisId = chassis.Id,
                GraphicsCardId = graphicsCard.Id,
                ChassisFans = [],
                StorageDevices = [],
                WiredNetworkAdapters = [],
                WirelessNetworkAdapters = []
            });

        var issue = results.Should().ContainSingle(r => r.Result.Reason == CompatibilityReason.PartSizeExceedsLimits)
            .Subject;
        issue.Parts.Should().Contain(p => p.Slot == CompatibilitySlot.Chassis && p.PartId == chassis.Id);
        issue.Parts.Should().Contain(p => p.Slot == CompatibilitySlot.GraphicsCard && p.PartId == graphicsCard.Id);
        issue.Parts.Should().NotContain(p => p.Slot.ToString().Contains("Gpu"));
    }

    private static Motherboard CreateMotherboard(int sataPorts) =>
        new(ManufacturerId, "B650", new MotherboardSpecs
        {
            SocketId = Guid.NewGuid(),
            ChipsetId = Guid.NewGuid(),
            RamSlots = 4,
            MaxMemoryGb = 128,
            MaxDimmSizeGb = 48,
            SataPorts = sataPorts,
            PwmFanHeaders = 4,
            DcFanHeaders = 0,
            EpsConnectors = 2,
            WidthMm = 244,
            HeightMm = 305,
            DdrGeneration = DdrGeneration.Ddr5,
            RamFormFactor = RamFormFactor.UDimm,
            MbFormFactor = MbFormFactor.Atx,
            WifiEnabled = false,
            BluetoothEnabled = false
        });

    private sealed class FakeCatalog : ICatalogRepository
    {
        public Dictionary<Guid, Chassis> Chassis { get; } = new();
        public Dictionary<Guid, ChassisFan> Fans { get; } = new();
        public Dictionary<Guid, Motherboard> Motherboards { get; } = new();
        public Dictionary<Guid, StorageDrive> Drives { get; } = new();
        public Dictionary<Guid, GraphicsCard> GraphicsCards { get; } = new();
        public Dictionary<Guid, WiredNetworkAdapter> Wired { get; } = new();
        public Dictionary<Guid, WirelessNetworkAdapter> Wireless { get; } = new();

        public Task<Chassis?> GetChassisByIdAsync(Guid id) =>
            Task.FromResult(Chassis.GetValueOrDefault(id));

        public Task<ChassisFan?> GetChassisFanByIdAsync(Guid id) =>
            Task.FromResult(Fans.GetValueOrDefault(id));

        public Task<List<ChassisFan>> GetChassisFansByIdsAsync(IReadOnlyCollection<Guid> ids) =>
            Task.FromResult(ids.Select(id => Fans.GetValueOrDefault(id)).Where(x => x is not null).Cast<ChassisFan>().ToList());

        public Task<Cpu?> GetCpuByIdAsync(Guid id) => Task.FromResult<Cpu?>(null);

        public Task<CpuCooler?> GetCpuCoolerByIdAsync(Guid id) => Task.FromResult<CpuCooler?>(null);

        public Task<GraphicsCard?> GetGraphicsCardByIdAsync(Guid id) =>
            Task.FromResult(GraphicsCards.GetValueOrDefault(id));

        public Task<Motherboard?> GetMotherboardByIdAsync(Guid id) =>
            Task.FromResult(Motherboards.GetValueOrDefault(id));

        public Task<Ram?> GetRamByIdAsync(Guid id) => Task.FromResult<Ram?>(null);

        public Task<StorageDrive?> GetStorageDeviceByIdAsync(Guid id) =>
            Task.FromResult(Drives.GetValueOrDefault(id));

        public Task<List<StorageDrive>> GetStorageDevicesByIdsAsync(IReadOnlyCollection<Guid> ids) =>
            Task.FromResult(ids.Select(id => Drives.GetValueOrDefault(id)).Where(x => x is not null).Cast<StorageDrive>().ToList());

        public Task<Psu?> GetPowerSupplyByIdAsync(Guid id) => Task.FromResult<Psu?>(null);

        public Task<WiredNetworkAdapter?> GetWiredNetworkAdapterByIdAsync(Guid id) =>
            Task.FromResult(Wired.GetValueOrDefault(id));

        public Task<List<WiredNetworkAdapter>> GetWiredNetworkAdaptersByIdsAsync(IReadOnlyCollection<Guid> ids) =>
            Task.FromResult(ids.Select(id => Wired.GetValueOrDefault(id)).Where(x => x is not null).Cast<WiredNetworkAdapter>().ToList());

        public Task<WirelessNetworkAdapter?> GetWirelessNetworkAdapterByIdAsync(Guid id) =>
            Task.FromResult(Wireless.GetValueOrDefault(id));

        public Task<List<WirelessNetworkAdapter>> GetWirelessNetworkAdaptersByIdsAsync(
            IReadOnlyCollection<Guid> ids) =>
            Task.FromResult(ids.Select(id => Wireless.GetValueOrDefault(id)).Where(x => x is not null).Cast<WirelessNetworkAdapter>().ToList());
    }
}
