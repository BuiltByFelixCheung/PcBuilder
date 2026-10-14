using FluentAssertions;
using PcBuilderBackend.Domain.Entities;
using PcBuilderBackend.Domain.Enums;
using PcBuilderBackend.Domain.ValueObjects;

namespace PcBuilderBackend.Domain.UnitTests.Catalog;

public class MotherboardTests
{
    private static readonly Guid ManufacturerId = Guid.NewGuid();
    private static readonly Guid SocketId = Guid.NewGuid();
    private static readonly Guid ChipsetId = Guid.NewGuid();

    [Fact]
    public void Pcie_m2_and_usb_collections_reject_duplicates()
    {
        var board = Create();
        var pcie = new MotherboardPcie(board.Id, PcieSlotType.X16, PcieSlotLane.X16, PcieGeneration.Gen4, 1);
        var m2 = new MotherboardM2(board.Id, M2Key.M, PcieGeneration.Gen4, 1, true);
        var usb = new MotherboardUsb(board.Id, UsbVersion.Usb32Gen2, UsbType.TypeA, 4);

        board.AddPcieSlot(pcie);
        board.AddM2Slot(m2);
        board.AddUsbPort(usb);

        var dupPcie = () => board.AddPcieSlot(new MotherboardPcie(board.Id, PcieSlotType.X16, PcieSlotLane.X16, PcieGeneration.Gen4, 2));
        var dupM2 = () => board.AddM2Slot(new MotherboardM2(board.Id, M2Key.M, PcieGeneration.Gen4, 2, true));
        var dupUsb = () => board.AddUsbPort(new MotherboardUsb(board.Id, UsbVersion.Usb32Gen2, UsbType.TypeA, 2));

        dupPcie.Should().Throw<ArgumentException>();
        dupM2.Should().Throw<ArgumentException>();
        dupUsb.Should().Throw<ArgumentException>();

        board.RemovePcieSlot(pcie);
        board.RemoveM2Slot(m2);
        board.RemoveUsbPort(usb);
        board.PcieSlots.Should().BeEmpty();
    }

    [Fact]
    public void Memory_compatibility_checks_generation_form_factor_and_size()
    {
        var board = Create();
        var ok = CreateRam(DdrGeneration.Ddr5, RamFormFactor.UDimm, 16, 32, 2);
        var wrongGen = CreateRam(DdrGeneration.Ddr4, RamFormFactor.UDimm, 16, 32, 2);
        var tooManyModules = CreateRam(DdrGeneration.Ddr5, RamFormFactor.UDimm, 16, 64, 8);

        board.CheckMemoryCompatibility(ok).Should().BeTrue();
        board.CheckMemoryCompatibility(wrongGen).Should().BeFalse();
        board.CheckMemoryCompatibility(tooManyModules).Should().BeFalse();
    }

    [Fact]
    public void Cpu_compatibility_uses_socket_and_chipset_support()
    {
        var board = Create();
        var cpu = new Cpu("7800X3D", ManufacturerId, new CpuSpecs
        {
            SocketId = SocketId,
            SeriesId = Guid.NewGuid(),
            MaxMemoryGb = 128,
            IntegratedGraphics = false,
            IncludedStockCooler = false,
            ThermalDesignPower = 120,
            PowerConsumptionWatts = 120
        });

        board.CheckCpuCompatibility(cpu).Reason.Should().Be(CompatibilityReason.ChipsetNotSupported);

        cpu.AddSupportedChipset(new CpuSupportChipset(cpu.Id, ChipsetId, requiresBiosUpdate: true));
        board.CheckCpuCompatibility(cpu).Status.Should().Be(PartsCompatibility.CompatibleActionRequired);

        cpu.RemoveSupportedChipset(cpu.SupportedChipsets.Single());
        cpu.AddSupportedChipset(new CpuSupportChipset(cpu.Id, ChipsetId));
        board.CheckCpuCompatibility(cpu).Status.Should().Be(PartsCompatibility.Compatible);

        var wrongSocket = new Cpu("i9", ManufacturerId, new CpuSpecs
        {
            SocketId = Guid.NewGuid(),
            SeriesId = Guid.NewGuid(),
            MaxMemoryGb = 128,
            IntegratedGraphics = false,
            IncludedStockCooler = false,
            ThermalDesignPower = 125,
            PowerConsumptionWatts = 125
        });
        board.CheckCpuCompatibility(wrongSocket).Reason.Should().Be(CompatibilityReason.SocketMismatch);
    }

    [Fact]
    public void Graphics_card_compatibility_requires_x16_and_may_reduce_generation()
    {
        var board = Create();
        var gpu = CreateGpu(PcieGeneration.Gen5);

        board.CheckGraphicsCardCompatibility(gpu).Reason.Should().Be(CompatibilityReason.NotEnoughPcieSlots);

        board.AddPcieSlot(new MotherboardPcie(board.Id, PcieSlotType.X16, PcieSlotLane.X16, PcieGeneration.Gen4, 1));
        var reduced = board.CheckGraphicsCardCompatibility(gpu);
        reduced.Status.Should().Be(PartsCompatibility.CompatibleReduced);
        reduced.Reason.Should().Be(CompatibilityReason.PcieGenerationReduced);
    }

    [Fact]
    public void E_key_m2_slot_cannot_support_sata()
    {
        var act = () => new MotherboardM2(Guid.NewGuid(), M2Key.E, PcieGeneration.Gen4, 1, supportsSata: true);

        act.Should().Throw<ArgumentException>().WithParameterName("supportsSata");
    }

    [Fact]
    public void Storage_sata_count_consumes_sata_ports()
    {
        var board = Create(sataPorts: 2);
        var drive = CreateHdd();

        board.CheckStorageCompatibility([drive, drive]).Status.Should().Be(PartsCompatibility.Compatible);
        board.CheckStorageCompatibility([drive, drive, drive]).Reason.Should().Be(CompatibilityReason.InsufficientSataPorts);

        var sataSsd = new StorageDrive("MX500", ManufacturerId, new StorageDriveSpecs
        {
            Media = StorageMedia.Ssd,
            Interface = StorageInterface.Sata,
            FormFactor = StorageFormFactor.Sata25,
            CapacityGb = 1000
        });
        board.CheckStorageCompatibility([sataSsd, sataSsd]).Status.Should().Be(PartsCompatibility.Compatible);
        board.CheckStorageCompatibility([sataSsd, sataSsd, sataSsd]).Reason.Should().Be(CompatibilityReason.InsufficientSataPorts);
    }

    [Fact]
    public void M2_slots_of_same_key_and_generation_can_differ_by_sata_or_form_factor()
    {
        var board = Create();
        AddM2(board, M2Key.M, PcieGeneration.Gen4, slotCount: 1, supportsSata: false, M2FormFactor.M22280);
        AddM2(board, M2Key.M, PcieGeneration.Gen4, slotCount: 1, supportsSata: true, M2FormFactor.M22280);
        AddM2(board, M2Key.M, PcieGeneration.Gen4, slotCount: 1, supportsSata: false, M2FormFactor.M222110);

        board.M2Slots.Should().HaveCount(3);

        var duplicateNvme2280 = () =>
            AddM2(board, M2Key.M, PcieGeneration.Gen4, slotCount: 2, supportsSata: false, M2FormFactor.M22280);
        duplicateNvme2280.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void Storage_m2_sata_and_nvme_only_slots_of_same_generation_are_distinct()
    {
        var board = Create();
        AddM2(board, M2Key.M, PcieGeneration.Gen4, slotCount: 1, supportsSata: false);
        AddM2(board, M2Key.M, PcieGeneration.Gen4, slotCount: 1, supportsSata: true);
        var nvme = CreateNvme(PcieGeneration.Gen4);
        var sataM2 = CreateSataM2();

        board.CheckStorageCompatibility([nvme, sataM2]).Status.Should().Be(PartsCompatibility.Compatible);
        board.CheckStorageCompatibility([sataM2, sataM2]).Reason.Should().Be(CompatibilityReason.NoMatchingM2Slot);
    }

    [Fact]
    public void Storage_m2_count_consumes_slot_count()
    {
        var board = Create();
        AddM2(board, M2Key.M, PcieGeneration.Gen4, slotCount: 1, supportsSata: false);
        var nvme = CreateNvme(PcieGeneration.Gen4);

        board.CheckStorageCompatibility(nvme).Status.Should().Be(PartsCompatibility.Compatible);
        board.CheckStorageCompatibility([nvme, nvme]).Reason.Should().Be(CompatibilityReason.NoMatchingM2Slot);
    }

    [Fact]
    public void Storage_m2_sata_requires_supports_sata()
    {
        var board = Create();
        AddM2(board, M2Key.M, PcieGeneration.Gen4, slotCount: 1, supportsSata: false);
        var sataM2 = CreateSataM2();

        board.CheckStorageCompatibility(sataM2).Reason.Should().Be(CompatibilityReason.SlotDoesNotSupportSata);
    }

    [Fact]
    public void Storage_m2_sata_does_not_reduce_pcie_generation()
    {
        var board = Create();
        AddM2(board, M2Key.M, PcieGeneration.Gen4, slotCount: 1, supportsSata: true);
        var sataM2 = new StorageDrive("SATA SSD", ManufacturerId, new StorageDriveSpecs
        {
            Media = StorageMedia.Ssd,
            Interface = StorageInterface.Sata,
            FormFactor = StorageFormFactor.M22280,
            CapacityGb = 1000,
            PcieGeneration = PcieGeneration.Gen5
        });

        board.CheckStorageCompatibility(sataM2).Status.Should().Be(PartsCompatibility.Compatible);
    }

    [Fact]
    public void Storage_m2_may_reduce_generation()
    {
        var board = Create();
        AddM2(board, M2Key.M, PcieGeneration.Gen4, slotCount: 1, supportsSata: false);
        var nvme = CreateNvme(PcieGeneration.Gen5);

        var reduced = board.CheckStorageCompatibility(nvme);
        reduced.Status.Should().Be(PartsCompatibility.CompatibleReduced);
        reduced.Reason.Should().Be(CompatibilityReason.PcieGenerationReduced);
    }

    [Fact]
    public void Network_pcie_count_consumes_slot_count()
    {
        var board = Create();
        board.AddPcieSlot(new MotherboardPcie(board.Id, PcieSlotType.X1, PcieSlotLane.X1, PcieGeneration.Gen4, 1));
        var nic = CreateWiredPcie(PcieSlotType.X1);

        board.CheckWiredNetworkAdapterCompatibility(nic).Status.Should().Be(PartsCompatibility.Compatible);
        board.CheckWiredNetworkAdapterCompatibility([nic, nic]).Reason.Should().Be(CompatibilityReason.NotEnoughPcieSlots);
    }

    [Fact]
    public void Network_usb_ports_are_shared_across_wired_and_wireless()
    {
        var board = Create();
        board.AddUsbPort(new MotherboardUsb(board.Id, UsbVersion.Usb32Gen1, UsbType.TypeA, 1));
        var wired = CreateWiredUsb();
        var wireless = CreateWirelessUsb();

        board.CheckWiredNetworkAdapterCompatibility(wired).Status.Should().Be(PartsCompatibility.Compatible);
        board.CheckNetworkAdapterCompatibility([wired], [wireless]).Reason.Should().Be(CompatibilityReason.NoMatchingUsbPort);
    }

    [Fact]
    public void Network_wireless_m2_consumes_e_key_slot_count()
    {
        var board = Create();
        AddM2(board, M2Key.E, PcieGeneration.Gen4, slotCount: 1, supportsSata: false, M2FormFactor.M22230);
        var wifi = CreateWirelessM2();

        board.CheckWirelessNetworkAdapterCompatibility(wifi).Status.Should().Be(PartsCompatibility.Compatible);
        board.CheckWirelessNetworkAdapterCompatibility([wifi, wifi]).Reason.Should().Be(CompatibilityReason.NoMatchingM2Slot);
    }

    private static Motherboard Create(int sataPorts = 4) =>
        new(ManufacturerId, "B650", new MotherboardSpecs
        {
            SocketId = SocketId,
            ChipsetId = ChipsetId,
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

    private static void AddM2(
        Motherboard board,
        M2Key key,
        PcieGeneration generation,
        int slotCount,
        bool supportsSata,
        M2FormFactor formFactor = M2FormFactor.M22280)
    {
        var slot = new MotherboardM2(board.Id, key, generation, slotCount, supportsSata);
        slot.AddFormFactor(new MotherboardM2FormFactor(slot.Id, formFactor));
        board.AddM2Slot(slot);
    }

    private static Ram CreateRam(DdrGeneration ddr, RamFormFactor form, int perStick, int total, int modules) =>
        new("Kit", ManufacturerId, new RamSpecs
        {
            Color = "Black",
            DdrGeneration = ddr,
            RamFormFactor = form,
            RamRank = RamRank.DualRank,
            MemorySizePerStickGb = perStick,
            TotalMemorySizeGb = total,
            ModulesCount = modules,
            MaxMemorySpeedMts = 6000,
            HeightMm = 40
        });

    private static GraphicsCard CreateGpu(PcieGeneration gen) =>
        new("RTX 4070", ManufacturerId, new GraphicsCardSpecs
        {
            GpuId = Guid.NewGuid(),
            VideoMemoryGb = 12,
            PcieSlotsUsed = 2,
            PcieGeneration = gen,
            IsLowProfile = false,
            LengthMm = 240,
            WidthMm = 120,
            HeightMm = 50,
            PowerConsumptionWatts = 200,
            PowerConnectorType = PsuCableType.Pcie6Plus2Pin,
            PowerConnectorCount = 2
        });

    private static StorageDrive CreateHdd() =>
        new("HDD", ManufacturerId, new StorageDriveSpecs
        {
            Media = StorageMedia.Hdd,
            Interface = StorageInterface.Sata,
            FormFactor = StorageFormFactor.Sata35,
            CapacityGb = 4000,
            Rpm = 7200
        });

    private static StorageDrive CreateNvme(PcieGeneration generation) =>
        new("990 PRO", ManufacturerId, new StorageDriveSpecs
        {
            Media = StorageMedia.Ssd,
            Interface = StorageInterface.Nvme,
            FormFactor = StorageFormFactor.M22280,
            CapacityGb = 2000,
            PcieGeneration = generation
        });

    private static StorageDrive CreateSataM2() =>
        new("SATA SSD", ManufacturerId, new StorageDriveSpecs
        {
            Media = StorageMedia.Ssd,
            Interface = StorageInterface.Sata,
            FormFactor = StorageFormFactor.M22280,
            CapacityGb = 1000,
            PcieGeneration = PcieGeneration.Gen3
        });

    private static WiredNetworkAdapter CreateWiredPcie(PcieSlotType slotType) =>
        new("I225-V", ManufacturerId, WiredHostInterface.Pcie, 2500, pcieSlotType: slotType);

    private static WiredNetworkAdapter CreateWiredUsb() =>
        new("USB NIC", ManufacturerId, WiredHostInterface.Usb, 1000, UsbVersion.Usb32Gen1, UsbType.TypeA);

    private static WirelessNetworkAdapter CreateWirelessUsb() =>
        new("USB WiFi", ManufacturerId, new WirelessNetworkAdapterSpecs
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

    private static WirelessNetworkAdapter CreateWirelessM2() =>
        new("AX210", ManufacturerId, new WirelessNetworkAdapterSpecs
        {
            WifiStandard = WifiStandard.Wifi6E,
            HostInterface = WirelessHostInterface.M2,
            MaxSpeedMbps = 2400,
            MaxSpeedMbps5G = null,
            MaxSpeedMbps6G = null,
            BluetoothVersion = BluetoothVersion.V5Point2,
            M2Key = M2Key.E,
            M2FormFactor = M2FormFactor.M22230
        });
}
