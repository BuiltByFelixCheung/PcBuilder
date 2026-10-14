using FluentAssertions;
using PcBuilderBackend.Domain.Entities;
using PcBuilderBackend.Domain.Enums;
using PcBuilderBackend.Domain.ValueObjects;

namespace PcBuilderBackend.Domain.UnitTests.Catalog;

public class PsuCompatibilityTests
{
    private static readonly Guid ManufacturerId = Guid.NewGuid();

    [Fact]
    public void Power_budget_is_compatible_when_wattage_covers_cpu_and_overhead()
    {
        var psu = CreatePsu(wattage: 400);
        var cpu = CreateCpu(powerConsumptionWatts: 200);

        var result = psu.CheckPowerBudget(cpu, gpu: null);

        result.Status.Should().Be(PartsCompatibility.Compatible);
    }

    [Fact]
    public void Power_budget_is_incompatible_when_required_watts_exceed_psu()
    {
        var psu = CreatePsu(wattage: 300);
        var cpu = CreateCpu(powerConsumptionWatts: 200);

        var result = psu.CheckPowerBudget(cpu, gpu: null);

        result.Status.Should().Be(PartsCompatibility.Incompatible);
        result.Reason.Should().Be(CompatibilityReason.ExceedsPowerBudget);
    }

    [Fact]
    public void Power_budget_includes_gpu_headroom()
    {
        var psu = CreatePsu(wattage: 650);
        var cpu = CreateCpu(powerConsumptionWatts: 200);
        var gpu = CreateGpu(powerConsumptionWatts: 250, PsuCableType.Pcie6Plus2Pin, 2);

        var result = psu.CheckPowerBudget(cpu, gpu);

        result.Status.Should().Be(PartsCompatibility.Incompatible);
        result.Reason.Should().Be(CompatibilityReason.ExceedsPowerBudget);
    }

    [Fact]
    public void Motherboard_compatibility_requires_24_pin_cable()
    {
        var psu = CreatePsu();
        psu.AddCable(new PsuCable(psu.Id, PsuCableType.Cpu4Plus4Pin, 2, 1));

        var result = psu.CheckMotherboardCompatibility(CreateMotherboard(epsConnectors: 1));

        result.Status.Should().Be(PartsCompatibility.Incompatible);
        result.Reason.Should().Be(CompatibilityReason.MissingMotherboardPowerCable);
    }

    [Fact]
    public void Motherboard_compatibility_requires_enough_cpu_cables()
    {
        var psu = CreatePsu();
        psu.AddCable(new PsuCable(psu.Id, PsuCableType.Motherboard24Pin, 1, 1));
        psu.AddCable(new PsuCable(psu.Id, PsuCableType.Cpu4Plus4Pin, 1, 1));

        var result = psu.CheckMotherboardCompatibility(CreateMotherboard(epsConnectors: 2));

        result.Status.Should().Be(PartsCompatibility.Incompatible);
        result.Reason.Should().Be(CompatibilityReason.InsufficientCpuPowerCables);
    }

    [Fact]
    public void Motherboard_compatibility_passes_with_24_pin_and_eps_cables()
    {
        var psu = CreatePsu();
        psu.AddCable(new PsuCable(psu.Id, PsuCableType.Motherboard24Pin, 1, 1));
        psu.AddCable(new PsuCable(psu.Id, PsuCableType.Cpu4Plus4Pin, 2, 1));

        var result = psu.CheckMotherboardCompatibility(CreateMotherboard(epsConnectors: 2));

        result.Status.Should().Be(PartsCompatibility.Compatible);
    }

    [Theory]
    [InlineData(PsuCableType.Pcie6Plus2Pin)]
    [InlineData(PsuCableType.Pcie12V2X6)]
    [InlineData(PsuCableType.Pcie12VHighPower)]
    public void Graphics_card_compatibility_requires_matching_pcie_cables(PsuCableType connector)
    {
        var psu = CreatePsu();
        var gpu = CreateGpu(200, connector, powerConnectorCount: 2);

        psu.CheckGraphicsCardCompatibility(gpu).Status.Should().Be(PartsCompatibility.Incompatible);
        psu.CheckGraphicsCardCompatibility(gpu).Reason.Should().Be(CompatibilityReason.InsufficientPciePowerCables);

        psu.AddCable(new PsuCable(psu.Id, connector, 2, 1));

        psu.CheckGraphicsCardCompatibility(gpu).Status.Should().Be(PartsCompatibility.Compatible);
    }

    [Fact]
    public void Graphics_card_compatibility_throws_for_unsupported_connector()
    {
        var psu = CreatePsu();
        var gpu = CreateGpu(200, PsuCableType.Sata, 1);

        var act = () => psu.CheckGraphicsCardCompatibility(gpu);

        act.Should().Throw<ArgumentOutOfRangeException>();
    }

    [Fact]
    public void Storage_compatibility_ignores_non_sata_drives()
    {
        var psu = CreatePsu();
        var nvme = CreateNvme();

        var result = psu.CheckStorageCompatibility(nvme);

        result.Status.Should().Be(PartsCompatibility.Compatible);
    }

    [Fact]
    public void Storage_compatibility_requires_sata_cables_for_sata_drives()
    {
        var psu = CreatePsu();
        var drives = new List<StorageDrive> { CreateHdd(), CreateHdd() };

        psu.CheckStorageCompatibility(drives).Status.Should().Be(PartsCompatibility.Incompatible);
        psu.CheckStorageCompatibility(drives).Reason.Should().Be(CompatibilityReason.InsufficientSataCables);

        psu.AddCable(new PsuCable(psu.Id, PsuCableType.Sata, 2, 4));

        psu.CheckStorageCompatibility(drives).Status.Should().Be(PartsCompatibility.Compatible);
    }

    [Fact]
    public void Chassis_compatibility_requires_matching_form_factor_and_length()
    {
        var chassis = new Chassis(
            "4000D",
            ManufacturerId,
            new ChassisSpecs
            {
                LengthMm = 450,
                WidthMm = 230,
                HeightMm = 460,
                MotherboardMaxWidthMm = 305,
                MotherboardMaxHeightMm = 244,
                MaxCpuCoolerHeightMm = 170,
                MaxGraphicsCardLengthMm = 370,
                MaxPsuLengthMm = 180
            });
        chassis.AddPsuFormFactor(new ChassisPsuFormFactor(chassis.Id, PsuFormFactor.Atx));

        var fitting = CreatePsu(formFactor: PsuFormFactor.Atx, lengthMm: 160);
        var tooLong = CreatePsu(formFactor: PsuFormFactor.Atx, lengthMm: 200);
        var wrongForm = CreatePsu(formFactor: PsuFormFactor.Sfx, lengthMm: 100);

        chassis.CheckPsuCompatibility(fitting).Should().BeTrue();
        chassis.CheckPsuCompatibility(tooLong).Should().BeFalse();
        chassis.CheckPsuCompatibility(wrongForm).Should().BeFalse();
    }

    private static Psu CreatePsu(
        int wattage = 850,
        PsuFormFactor formFactor = PsuFormFactor.Atx,
        decimal lengthMm = 160) =>
        new("RM850x", ManufacturerId, new PsuSpecs
        {
            Wattage = wattage,
            Modularity = PsuModularity.FullModular,
            FormFactor = formFactor,
            LengthMm = lengthMm,
            WidthMm = 150,
            HeightMm = 86
        });

    private static Cpu CreateCpu(int powerConsumptionWatts) =>
        new("7800X3D", ManufacturerId, new CpuSpecs
        {
            SocketId = Guid.NewGuid(),
            SeriesId = Guid.NewGuid(),
            MaxMemoryGb = 128,
            IntegratedGraphics = false,
            IncludedStockCooler = false,
            ThermalDesignPower = 120,
            PowerConsumptionWatts = powerConsumptionWatts
        });

    private static GraphicsCard CreateGpu(int powerConsumptionWatts, PsuCableType connector, int powerConnectorCount) =>
        new("RTX 4070", ManufacturerId, new GraphicsCardSpecs
        {
            GpuId = Guid.NewGuid(),
            VideoMemoryGb = 12,
            PcieSlotsUsed = 2,
            PcieGeneration = PcieGeneration.Gen4,
            IsLowProfile = false,
            LengthMm = 240,
            WidthMm = 120,
            HeightMm = 50,
            PowerConsumptionWatts = powerConsumptionWatts,
            PowerConnectorType = connector,
            PowerConnectorCount = powerConnectorCount
        });

    private static Motherboard CreateMotherboard(int epsConnectors) =>
        new(ManufacturerId, "B650", new MotherboardSpecs
        {
            SocketId = Guid.NewGuid(),
            ChipsetId = Guid.NewGuid(),
            RamSlots = 4,
            MaxMemoryGb = 128,
            MaxDimmSizeGb = 48,
            SataPorts = 4,
            PwmFanHeaders = 4,
            DcFanHeaders = 0,
            EpsConnectors = epsConnectors,
            WidthMm = 244,
            HeightMm = 305,
            DdrGeneration = DdrGeneration.Ddr5,
            RamFormFactor = RamFormFactor.UDimm,
            MbFormFactor = MbFormFactor.Atx,
            WifiEnabled = false,
            BluetoothEnabled = false
        });

    private static StorageDrive CreateNvme() =>
        new("990 PRO", ManufacturerId, new StorageDriveSpecs
        {
            Media = StorageMedia.Ssd,
            Interface = StorageInterface.Nvme,
            FormFactor = StorageFormFactor.M22280,
            CapacityGb = 2000,
            PcieGeneration = PcieGeneration.Gen4
        });

    private static StorageDrive CreateHdd() =>
        new("Barracuda", ManufacturerId, new StorageDriveSpecs
        {
            Media = StorageMedia.Hdd,
            Interface = StorageInterface.Sata,
            FormFactor = StorageFormFactor.Sata35,
            CapacityGb = 4000,
            Rpm = 7200
        });
}
