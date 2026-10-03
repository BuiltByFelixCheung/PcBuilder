using FluentAssertions;
using PcBuilderBackend.Domain.Entities;
using PcBuilderBackend.Domain.Enums;
using PcBuilderBackend.Domain.ValueObjects;

namespace PcBuilderBackend.Domain.UnitTests.Catalog;

public class StorageAndCoolerTests
{
    private static readonly Guid ManufacturerId = Guid.NewGuid();

    [Fact]
    public void Storage_hdd_requires_rpm_and_hdd_media()
    {
        var ok = new StorageDrive("HDD", ManufacturerId, new StorageDriveSpecs
        {
            Media = StorageMedia.Hdd,
            Interface = StorageInterface.Sata,
            FormFactor = StorageFormFactor.Sata35,
            CapacityGb = 4000,
            Rpm = 7200
        });
        ok.IsM2.Should().BeFalse();
        ok.Rpm.Should().Be(7200);

        var ssdOnHddForm = () => new StorageDrive("Bad", ManufacturerId, new StorageDriveSpecs
        {
            Media = StorageMedia.Ssd,
            Interface = StorageInterface.Sata,
            FormFactor = StorageFormFactor.Sata35,
            CapacityGb = 1000
        });
        var missingRpm = () => new StorageDrive("Bad", ManufacturerId, new StorageDriveSpecs
        {
            Media = StorageMedia.Hdd,
            Interface = StorageInterface.Sata,
            FormFactor = StorageFormFactor.Sata35,
            CapacityGb = 1000
        });

        ssdOnHddForm.Should().Throw<ArgumentException>().WithParameterName("storageMedia");
        missingRpm.Should().Throw<ArgumentException>().WithParameterName("rpm");
    }

    [Fact]
    public void Storage_2_5_ssd_is_sata_without_rpm_or_pcie()
    {
        var ok = new StorageDrive("MX500", ManufacturerId, new StorageDriveSpecs
        {
            Media = StorageMedia.Ssd,
            Interface = StorageInterface.Sata,
            FormFactor = StorageFormFactor.Sata25,
            CapacityGb = 1000
        });
        ok.IsM2.Should().BeFalse();
        ok.Rpm.Should().BeNull();
        ok.PcieGeneration.Should().BeNull();

        var nvme = () => new StorageDrive("Bad", ManufacturerId, new StorageDriveSpecs
        {
            Media = StorageMedia.Ssd,
            Interface = StorageInterface.Nvme,
            FormFactor = StorageFormFactor.Sata25,
            CapacityGb = 1000
        });
        nvme.Should().Throw<ArgumentException>().WithParameterName("storageInterface");
    }

    [Fact]
    public void Storage_ssd_requires_pcie_generation_and_exposes_m2_key()
    {
        var nvme = new StorageDrive("990 PRO", ManufacturerId, new StorageDriveSpecs
        {
            Media = StorageMedia.Ssd,
            Interface = StorageInterface.Nvme,
            FormFactor = StorageFormFactor.M22280,
            CapacityGb = 2000,
            PcieGeneration = PcieGeneration.Gen4
        });
        nvme.IsM2.Should().BeTrue();
        nvme.ModuleKey.Should().Be(M2Key.M);
        nvme.M2FormFactor.Should().Be(M2FormFactor.M22280);

        var missingGen = () => new StorageDrive("SSD", ManufacturerId, new StorageDriveSpecs
        {
            Media = StorageMedia.Ssd,
            Interface = StorageInterface.Nvme,
            FormFactor = StorageFormFactor.M22280,
            CapacityGb = 1000
        });
        missingGen.Should().Throw<ArgumentException>().WithParameterName("pcieGeneration");
    }

    [Fact]
    public void Air_cooler_requires_heights_and_checks_cpu_tdp_and_ram_clearance()
    {
        var cooler = new CpuCooler(
            ManufacturerId,
            "NH-D15",
            CpuCoolerType.Air,
            165,
            32,
            null,
            coolerLengthMm: 150,
            coolerWidthMm: 135,
            fanThicknessMm: 140,
            fanWidthMm: 150,
            fanHeightMm: 25,
            fanCount: 2);
        cooler.CoolerLengthMm.Should().Be(150);
        cooler.CoolerWidthMm.Should().Be(135);
        cooler.FanThicknessMm.Should().Be(140);
        cooler.FanWidthMm.Should().Be(150);
        cooler.FanHeightMm.Should().Be(25);
        cooler.FanCount.Should().Be(2);
        var socketId = Guid.NewGuid();
        cooler.AddCpuCoolerSocket(new CpuCoolerSocket(cooler.Id, socketId));

        var cpuOk = new Cpu("CPU", ManufacturerId, new CpuSpecs
        {
            SocketId = socketId,
            SeriesId = Guid.NewGuid(),
            MaxMemoryGb = 128,
            IntegratedGraphics = false,
            IncludedStockCooler = false,
            ThermalDesignPower = 120,
            PowerConsumptionWatts = 120
        });
        var cpuHot = new Cpu("CPU", ManufacturerId, new CpuSpecs
        {
            SocketId = socketId,
            SeriesId = Guid.NewGuid(),
            MaxMemoryGb = 128,
            IntegratedGraphics = false,
            IncludedStockCooler = false,
            ThermalDesignPower = 200,
            PowerConsumptionWatts = 200
        });
        var otherSocket = new Cpu("CPU", ManufacturerId, new CpuSpecs
        {
            SocketId = Guid.NewGuid(),
            SeriesId = Guid.NewGuid(),
            MaxMemoryGb = 128,
            IntegratedGraphics = false,
            IncludedStockCooler = false,
            ThermalDesignPower = 65,
            PowerConsumptionWatts = 65
        });

        cooler.CheckCompatibility(cpuOk).Status.Should().Be(PartsCompatibility.Compatible);
        cooler.CheckCompatibility(cpuHot).Status.Should().Be(PartsCompatibility.Compatible);
        cooler.CheckCompatibility(otherSocket).Reason.Should().Be(CompatibilityReason.MissingCpuCoolerSocket);

        var shortRam = new Ram("Low", ManufacturerId, new RamSpecs
        {
            Color = "Black",
            DdrGeneration = DdrGeneration.Ddr5,
            RamFormFactor = RamFormFactor.UDimm,
            RamRank = RamRank.SingleRank,
            MemorySizePerStickGb = 16,
            TotalMemorySizeGb = 32,
            ModulesCount = 2,
            MaxMemorySpeedMts = 6000,
            HeightMm = 30
        });
        var tallRam = new Ram("Tall", ManufacturerId, new RamSpecs
        {
            Color = "Black",
            DdrGeneration = DdrGeneration.Ddr5,
            RamFormFactor = RamFormFactor.UDimm,
            RamRank = RamRank.SingleRank,
            MemorySizePerStickGb = 16,
            TotalMemorySizeGb = 32,
            ModulesCount = 2,
            MaxMemorySpeedMts = 6000,
            HeightMm = 50
        });
        cooler.CheckCompatibility(shortRam).Status.Should().Be(PartsCompatibility.Compatible);
        cooler.CheckCompatibility(tallRam).Reason.Should().Be(CompatibilityReason.RamHeightExceedsCoolerLimit);
    }

    [Fact]
    public void Liquid_cooler_requires_radiator_class_and_stores_optional_dimensions()
    {
        var ok = new CpuCooler(
            ManufacturerId,
            "360",
            CpuCoolerType.Water,
            null,
            null,
            RadiatorClass.Mm360,
            394,
            120,
            27,
            waterBlockLengthMm: 78,
            waterBlockWidthMm: 72,
            waterBlockHeightMm: 55);
        ok.CoolerHeightMm.Should().BeNull();
        ok.CoolerLengthMm.Should().BeNull();
        ok.RadiatorLengthMm.Should().Be(394);
        ok.RadiatorWidthMm.Should().Be(120);
        ok.RadiatorHeightMm.Should().Be(27);
        ok.WaterBlockLengthMm.Should().Be(78);
        ok.WaterBlockWidthMm.Should().Be(72);
        ok.WaterBlockHeightMm.Should().Be(55);

        var missing = () => new CpuCooler(ManufacturerId, "360", CpuCoolerType.Water, null, null, null);
        missing.Should().Throw<ArgumentException>().WithParameterName("radiatorClass");
    }

    [Fact]
    public void Chassis_fan_rejects_invalid_diameter_and_count()
    {
        var fan = new ChassisFan("LL120", ManufacturerId, FanDiameterMm.Mm120, 3);
        fan.FansCountPerPack.Should().Be(3);

        var badCount = () => new ChassisFan("Fan", ManufacturerId, FanDiameterMm.Mm120, 0);
        badCount.Should().Throw<ArgumentOutOfRangeException>();
    }
}
