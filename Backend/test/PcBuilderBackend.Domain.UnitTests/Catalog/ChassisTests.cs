using FluentAssertions;
using PcBuilderBackend.Domain.Entities;
using PcBuilderBackend.Domain.Enums;
using PcBuilderBackend.Domain.ValueObjects;

namespace PcBuilderBackend.Domain.UnitTests.Catalog;

public class ChassisTests
{
    private static readonly Guid ManufacturerId = Guid.NewGuid();

    [Fact]
    public void Child_collections_reject_duplicates_and_missing_removes()
    {
        var chassis = Create();
        var bay = new ChassisDriveBay(chassis.Id, [DriveBayFormFactor.Inch35], 2);
        chassis.AddDriveBay(bay);
        var dup = () => chassis.AddDriveBay(new ChassisDriveBay(chassis.Id, [DriveBayFormFactor.Inch35], 1));
        dup.Should().Throw<ArgumentException>();
        chassis.RemoveDriveBay(bay);
        chassis.DriveBays.Should().BeEmpty();

        var mount = new ChassisFanMount(chassis.Id, FanMountLocation.Front, false);
        chassis.AddFanMount(mount);
        var dupMount = () => chassis.AddFanMount(new ChassisFanMount(chassis.Id, FanMountLocation.Front, true));
        dupMount.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void Motherboard_compatibility_checks_form_factor_and_size()
    {
        var chassis = Create();
        chassis.AddMbFormFactor(new ChassisMbFormFactor(chassis.Id, MbFormFactor.Atx));
        var board = new Motherboard(ManufacturerId, "B650", new MotherboardSpecs
        {
            SocketId = Guid.NewGuid(),
            ChipsetId = Guid.NewGuid(),
            RamSlots = 4,
            MaxMemoryGb = 128,
            MaxDimmSizeGb = 48,
            SataPorts = 4,
            FanConnectors = 4,
            EpsConnectors = 2,
            WidthMm = 244,
            HeightMm = 244,
            DdrGeneration = DdrGeneration.Ddr5,
            RamFormFactor = RamFormFactor.UDimm,
            MbFormFactor = MbFormFactor.Atx,
            WifiEnabled = false,
            BluetoothEnabled = false
        });
        var itx = new Motherboard(ManufacturerId, "ITX", new MotherboardSpecs
        {
            SocketId = Guid.NewGuid(),
            ChipsetId = Guid.NewGuid(),
            RamSlots = 2,
            MaxMemoryGb = 64,
            MaxDimmSizeGb = 32,
            SataPorts = 4,
            FanConnectors = 3,
            EpsConnectors = 1,
            WidthMm = 170,
            HeightMm = 170,
            DdrGeneration = DdrGeneration.Ddr5,
            RamFormFactor = RamFormFactor.UDimm,
            MbFormFactor = MbFormFactor.Mitx,
            WifiEnabled = false,
            BluetoothEnabled = false
        });

        chassis.CheckMotherboardCompatibility(board).Should().BeTrue();
        chassis.CheckMotherboardCompatibility(itx).Should().BeFalse();
    }

    [Fact]
    public void Storage_compatibility_uses_drive_bays_and_ignores_m2()
    {
        var chassis = Create();
        chassis.AddDriveBay(new ChassisDriveBay(chassis.Id, [DriveBayFormFactor.Inch35], 1));
        var hdd = new StorageDrive("HDD", ManufacturerId, new StorageDriveSpecs
        {
            Media = StorageMedia.Hdd,
            Interface = StorageInterface.Sata,
            FormFactor = StorageFormFactor.Sata35,
            CapacityGb = 4000,
            Rpm = 7200
        });
        var nvme = new StorageDrive("SSD", ManufacturerId, new StorageDriveSpecs
        {
            Media = StorageMedia.Ssd,
            Interface = StorageInterface.Nvme,
            FormFactor = StorageFormFactor.M22280,
            CapacityGb = 2000,
            PcieGeneration = PcieGeneration.Gen4
        });

        chassis.CheckStorageDriveCompatibility(nvme).Should().BeTrue();
        chassis.CheckStorageDriveCompatibility(hdd).Should().BeTrue();
        chassis.CheckStorageDriveCompatibility([hdd, hdd]).Should().BeFalse();

        chassis.AddDriveBay(new ChassisDriveBay(chassis.Id, [DriveBayFormFactor.Inch25], 1));
        var sataSsd = new StorageDrive("MX500", ManufacturerId, new StorageDriveSpecs
        {
            Media = StorageMedia.Ssd,
            Interface = StorageInterface.Sata,
            FormFactor = StorageFormFactor.Sata25,
            CapacityGb = 1000
        });
        chassis.CheckStorageDriveCompatibility(sataSsd).Should().BeTrue();
        chassis.CheckStorageDriveCompatibility([sataSsd, sataSsd]).Should().BeFalse();
    }

    [Fact]
    public void Combo_drive_bay_shares_slots_between_sizes()
    {
        var chassis = Create();
        chassis.AddDriveBay(new ChassisDriveBay(
            chassis.Id,
            [DriveBayFormFactor.Inch25, DriveBayFormFactor.Inch35],
            2));
        var hdd = new StorageDrive("HDD", ManufacturerId, new StorageDriveSpecs
        {
            Media = StorageMedia.Hdd,
            Interface = StorageInterface.Sata,
            FormFactor = StorageFormFactor.Sata35,
            CapacityGb = 4000,
            Rpm = 7200
        });
        var ssd = new StorageDrive("SSD", ManufacturerId, new StorageDriveSpecs
        {
            Media = StorageMedia.Ssd,
            Interface = StorageInterface.Sata,
            FormFactor = StorageFormFactor.Sata25,
            CapacityGb = 1000
        });

        chassis.CheckStorageDriveCompatibility([hdd, ssd]).Should().BeTrue();
        chassis.CheckStorageDriveCompatibility([hdd, hdd, ssd, ssd]).Should().BeFalse();
    }

    [Fact]
    public void Fan_compatibility_assigns_mount_capacity()
    {
        var chassis = Create();
        var mount = new ChassisFanMount(chassis.Id, FanMountLocation.Front, false);
        mount.AddOption(new ChassisFanMountOption(mount.Id, FanDiameterMm.Mm120, 3));
        chassis.AddFanMount(mount);

        var fan = new ChassisFan("LL120", ManufacturerId, FanDiameterMm.Mm120, 3);
        var tooMany = new ChassisFan("LL120", ManufacturerId, FanDiameterMm.Mm120, 4);

        chassis.CheckFanCompatibility(fan).Should().BeTrue();
        chassis.CheckFanCompatibility(tooMany).Should().BeFalse();
    }

    [Fact]
    public void Air_cooler_height_and_aio_radiator_are_checked()
    {
        var chassis = Create();
        chassis.AddRadiator(new ChassisRadiator(chassis.Id, RadiatorClass.Mm360, RadiatorMountLocation.Top, 1));

        var airOk = new CpuCooler(ManufacturerId, "NH-D15", new CpuCoolerSpecs
        {
            Type = CpuCoolerType.Air,
            CoolerHeightMm = 150,
            MaxRamHeightMm = 35
        });
        var airTall = new CpuCooler(ManufacturerId, "Tall", new CpuCoolerSpecs
        {
            Type = CpuCoolerType.Air,
            CoolerHeightMm = 180,
            MaxRamHeightMm = 35
        });
        var aio = new CpuCooler(ManufacturerId, "360", new CpuCoolerSpecs
        {
            Type = CpuCoolerType.Water,
            RadiatorClass = RadiatorClass.Mm360
        });
        var aioWrong = new CpuCooler(ManufacturerId, "240", new CpuCoolerSpecs
        {
            Type = CpuCoolerType.Water,
            RadiatorClass = RadiatorClass.Mm240
        });

        chassis.CheckCpuCoolerCompatibility(airOk).Should().BeTrue();
        chassis.CheckCpuCoolerCompatibility(airTall).Should().BeFalse();
        chassis.CheckCpuCoolerCompatibility(aio).Should().BeTrue();
        chassis.CheckCpuCoolerCompatibility(aioWrong).Should().BeFalse();
    }

    [Fact]
    public void Constructor_rejects_non_positive_dimensions()
    {
        var act = () => new Chassis("Case", ManufacturerId, new ChassisSpecs
        {
            LengthMm = 0,
            WidthMm = 230,
            HeightMm = 460,
            MotherboardMaxWidthMm = 305,
            MotherboardMaxHeightMm = 244,
            MaxCpuCoolerHeightMm = 170,
            MaxGraphicsCardLengthMm = 370,
            MaxPsuLengthMm = 180
        });

        act.Should().Throw<ArgumentOutOfRangeException>();
    }

    private static Chassis Create() =>
        new("4000D", ManufacturerId, new ChassisSpecs
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
}
