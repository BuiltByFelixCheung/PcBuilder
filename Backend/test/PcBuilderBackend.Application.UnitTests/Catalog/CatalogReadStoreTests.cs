using AutoMapper;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using PcBuilderBackend.Application.Catalog.Chassis.Dto;
using PcBuilderBackend.Application.Catalog.ChassisFans.Dto;
using PcBuilderBackend.Application.Catalog.CpuCoolers.Dto;
using PcBuilderBackend.Application.Catalog.Cpus.Dto;
using PcBuilderBackend.Application.Catalog.GraphicsCards.Dto;
using PcBuilderBackend.Application.Catalog.Memories.Dto;
using PcBuilderBackend.Application.Catalog.Motherboards.Dto;
using PcBuilderBackend.Application.Catalog.Psus.Dto;
using PcBuilderBackend.Application.Catalog.StorageDrives.Dto;
using PcBuilderBackend.Application.Catalog.WiredNetworkAdapters.Dto;
using PcBuilderBackend.Application.Catalog.WirelessNetworkAdapters.Dto;
using PcBuilderBackend.Application.Common.Dto;
using PcBuilderBackend.Application.Common.Mappings;
using PcBuilderBackend.Domain.Entities;
using PcBuilderBackend.Domain.Enums;
using PcBuilderBackend.Domain.ValueObjects;
using PcBuilderBackend.Infrastructure.Persistence;
using PcBuilderBackend.Infrastructure.Persistence.Queries;

namespace PcBuilderBackend.Application.UnitTests.Catalog;

public class CatalogReadStoreTests : IDisposable
{
    private readonly PcBuilderDbContext _db;
    private readonly IMapper _mapper;
    private readonly Manufacturer _manufacturer;
    private readonly Socket _socket;
    private readonly Chipset _chipset;
    private readonly CpuSeries _cpuSeries;
    private readonly GpuSeries _gpuSeries;
    private readonly Gpu _gpu;

    public CatalogReadStoreTests()
    {
        var options = new DbContextOptionsBuilder<PcBuilderDbContext>()
            .UseInMemoryDatabase($"catalog-{Guid.NewGuid()}")
            .Options;
        _db = new PcBuilderDbContext(options);
        _mapper = new MapperConfiguration(
            cfg => cfg.AddMaps(typeof(ManufacturerProfile).Assembly),
            NullLoggerFactory.Instance).CreateMapper();

        _manufacturer = new Manufacturer("ASUS");
        _db.Manufacturers.Add(_manufacturer);
        _db.SaveChanges();

        _socket = new Socket(_manufacturer.Id, "AM5");
        _db.Sockets.Add(_socket);
        _db.SaveChanges();

        _chipset = new Chipset("X870", _manufacturer.Id, _socket.Id);
        _cpuSeries = new CpuSeries(_manufacturer.Id, _socket.Id, "Ryzen 7000");
        _gpuSeries = new GpuSeries(_manufacturer.Id, "GeForce RTX 40");
        _db.Chipsets.Add(_chipset);
        _db.CpuSeries.Add(_cpuSeries);
        _db.GpuSeries.Add(_gpuSeries);
        _db.SaveChanges();

        _gpu = new Gpu("RTX 4070", _manufacturer.Id, _gpuSeries.Id);
        _db.Gpus.Add(_gpu);
        _db.SaveChanges();
    }

    public void Dispose()
    {
        _db.Dispose();
        GC.SuppressFinalize(this);
    }

    [Fact]
    public async Task Motherboard_store_lists_filters_and_loads_children()
    {
        var board = SeedMotherboard("ROG Strix");
        var store = new MotherboardReadStore(_db, _mapper);

        var listed = await store.ListAsync(new PagedRequest(), CancellationToken.None);
        listed.TotalCount.Should().Be(1);
        listed.Items.Should().ContainSingle(x => x.Name == "ROG Strix" && x.ManufacturerName == "ASUS");

        var filtered = await store.FilterAsync(
            new PagedRequest<MotherboardFilter>(new MotherboardFilter
            {
                Name = "ROG",
                ManufacturerId = _manufacturer.Id,
                SocketId = _socket.Id,
                ChipsetId = _chipset.Id,
                FormFactor = MbFormFactor.Atx,
                DdrGeneration = DdrGeneration.Ddr5,
                WifiEnabled = true
            }),
            CancellationToken.None);
        filtered.Items.Should().ContainSingle();

        (await store.GetByIdAsync(board.Id, CancellationToken.None))!.ChipsetName.Should().Be("X870");
        (await store.GetByIdAsync(Guid.NewGuid(), CancellationToken.None)).Should().BeNull();

        (await store.ListPcieSlotsAsync(board.Id, CancellationToken.None)).Should().ContainSingle();
        (await store.ListM2SlotsAsync(board.Id, CancellationToken.None)).Should().ContainSingle();
        (await store.ListUsbPortsAsync(board.Id, CancellationToken.None)).Should().ContainSingle();
        (await store.ListPcieSlotsAsync(Guid.NewGuid(), CancellationToken.None)).Should().BeEmpty();
        (await store.ListM2SlotsAsync(Guid.NewGuid(), CancellationToken.None)).Should().BeEmpty();
        (await store.ListUsbPortsAsync(Guid.NewGuid(), CancellationToken.None)).Should().BeEmpty();
    }

    [Fact]
    public async Task Motherboard_filter_by_chassis_keeps_compatible_boards()
    {
        SeedMotherboard("ROG Strix");
        var chassis = SeedChassis("4000D");
        var store = new MotherboardReadStore(_db, _mapper);

        var compatible = await store.FilterAsync(
            new PagedRequest<MotherboardFilter>(new MotherboardFilter { ChassisId = chassis.Id }),
            CancellationToken.None);
        compatible.Items.Should().ContainSingle();

        var missing = await store.FilterAsync(
            new PagedRequest<MotherboardFilter>(new MotherboardFilter { ChassisId = Guid.NewGuid() }),
            CancellationToken.None);
        missing.Items.Should().BeEmpty();
        missing.TotalCount.Should().Be(0);
    }

    [Fact]
    public async Task Chassis_store_lists_filters_and_loads_children()
    {
        var chassis = SeedChassis("4000D");
        var store = new ChassisReadStore(_db, _mapper);

        var listed = await store.ListAsync(new PagedRequest(), CancellationToken.None);
        listed.Items.Should().ContainSingle(x => x.Name == "4000D" && x.ManufacturerName == "ASUS");

        var filtered = await store.FilterAsync(
            new PagedRequest<ChassisFilter>(new ChassisFilter
            {
                Name = "4000",
                ManufacturerId = _manufacturer.Id,
                LengthMm = null,
                WidthMm = null,
                HeightMm = null,
                MotherboardMaxWidthMm = null,
                MotherboardMaxHeightMm = null,
                MaxCpuCoolerHeightMm = null,
                MaxGraphicsCardLengthMm = null,
                MaxPsuLengthMm = null,
                MaxSupportedMbFormFactor = MbFormFactor.Atx
            }),
            CancellationToken.None);
        filtered.Items.Should().ContainSingle();

        var formFactorOnly = await store.FilterAsync(
            new PagedRequest<ChassisFilter>(new ChassisFilter
            {
                MaxSupportedMbFormFactor = MbFormFactor.Atx
            }),
            CancellationToken.None);
        formFactorOnly.Items.Should().ContainSingle(x => x.Name == "4000D");

        SeedChassis("NR200", MbFormFactor.Mitx);
        SeedChassis("O11D Evo", MbFormFactor.Atx, MbFormFactor.Eatx);
        var mitxOnly = await store.FilterAsync(
            new PagedRequest<ChassisFilter>(new ChassisFilter
            {
                MaxSupportedMbFormFactor = MbFormFactor.Mitx
            }),
            CancellationToken.None);
        mitxOnly.Items.Should().ContainSingle(x => x.Name == "NR200");

        var eatxOnly = await store.FilterAsync(
            new PagedRequest<ChassisFilter>(new ChassisFilter
            {
                MaxSupportedMbFormFactor = MbFormFactor.Eatx
            }),
            CancellationToken.None);
        eatxOnly.Items.Should().ContainSingle(x => x.Name == "O11D Evo");

        (await store.GetByIdAsync(chassis.Id, CancellationToken.None))!.MbFormFactors.Should()
            .Contain(MbFormFactor.Atx);
        (await store.GetByIdAsync(Guid.NewGuid(), CancellationToken.None)).Should().BeNull();

        (await store.ListDriveBaysAsync(chassis.Id, CancellationToken.None)).Should().ContainSingle();
        (await store.ListFanMountsAsync(chassis.Id, CancellationToken.None)).Should().ContainSingle();
        (await store.ListMbFormFactorsAsync(chassis.Id, CancellationToken.None)).Should()
            .Contain(MbFormFactor.Atx);
        (await store.ListPcieSlotsAsync(chassis.Id, CancellationToken.None)).Should().ContainSingle();
        (await store.ListPsuFormFactorsAsync(chassis.Id, CancellationToken.None)).Should()
            .Contain(PsuFormFactor.Atx);
        (await store.ListRadiatorsAsync(chassis.Id, CancellationToken.None)).Should().ContainSingle();
        (await store.ListDriveBaysAsync(Guid.NewGuid(), CancellationToken.None)).Should().BeEmpty();
        (await store.ListFanMountsAsync(Guid.NewGuid(), CancellationToken.None)).Should().BeEmpty();
        (await store.ListMbFormFactorsAsync(Guid.NewGuid(), CancellationToken.None)).Should().BeEmpty();
        (await store.ListPcieSlotsAsync(Guid.NewGuid(), CancellationToken.None)).Should().BeEmpty();
        (await store.ListPsuFormFactorsAsync(Guid.NewGuid(), CancellationToken.None)).Should().BeEmpty();
        (await store.ListRadiatorsAsync(Guid.NewGuid(), CancellationToken.None)).Should().BeEmpty();
    }

    [Fact]
    public async Task Remaining_stores_list_filter_and_get_by_id()
    {
        var cpu = SeedCpu("7800X3D");
        var psu = SeedPsu("RM850x");
        var ram = SeedRam("Fury");
        var card = SeedGraphicsCard("TUF 4070");
        var drive = SeedStorage("MX500");
        var fan = SeedChassisFan("AF120");
        var cooler = SeedCpuCooler("NH-D15");
        var wired = SeedWiredNic("I225-V");
        var wireless = SeedWirelessNic("AX210");

        var cpuStore = new CpuReadStore(_db, _mapper);
        (await cpuStore.ListAsync(new PagedRequest(), CancellationToken.None)).Items
            .Should().ContainSingle(x => x.Name == "7800X3D");
        (await cpuStore.FilterAsync(
                new PagedRequest<CpuFilter>(new CpuFilter(ManufacturerId: _manufacturer.Id, Name: "7800")),
                CancellationToken.None)).Items
            .Should().ContainSingle();
        (await cpuStore.GetByIdAsync(cpu.Id, CancellationToken.None))!.SeriesName.Should().NotBeNullOrEmpty();
        (await cpuStore.ListRamCompatsAsync(cpu.Id, CancellationToken.None)).Should().ContainSingle();
        (await cpuStore.ListSupportChipsetsAsync(cpu.Id, CancellationToken.None)).Should().ContainSingle();
        (await cpuStore.GetByIdAsync(Guid.NewGuid(), CancellationToken.None)).Should().BeNull();
        (await cpuStore.FilterAsync(
                new PagedRequest<CpuFilter>(new CpuFilter(MotherboardId: Guid.NewGuid())),
                CancellationToken.None)).TotalCount
            .Should().Be(0);
        var board = SeedMotherboard("ROG Strix");
        (await cpuStore.FilterAsync(
                new PagedRequest<CpuFilter>(new CpuFilter(MotherboardId: board.Id)),
                CancellationToken.None)).Items
            .Should().ContainSingle(x =>
                x.Name == "7800X3D"
                && x.ManufacturerName == "ASUS"
                && x.SeriesName == "Ryzen 7000"
                && x.SocketName == "AM5");

        var psuStore = new PsuReadStore(_db, _mapper);
        (await psuStore.ListAsync(new PagedRequest(), CancellationToken.None)).Items
            .Should().ContainSingle(x => x.Name == "RM850x");
        (await psuStore.FilterAsync(
                new PagedRequest<PsuFilter>(new PsuFilter
                {
                    Name = "RM",
                    ManufacturerId = _manufacturer.Id,
                    FormFactor = PsuFormFactor.Atx
                }),
                CancellationToken.None)).Items
            .Should().ContainSingle();
        (await psuStore.GetByIdAsync(psu.Id, CancellationToken.None))!.Cables.Should().ContainSingle();
        (await psuStore.ListCablesAsync(psu.Id, CancellationToken.None)).Should().ContainSingle();
        (await psuStore.ListCablesAsync(Guid.NewGuid(), CancellationToken.None)).Should().BeEmpty();
        (await psuStore.FilterAsync(
                new PagedRequest<PsuFilter>(new PsuFilter { ChassisId = Guid.NewGuid() }),
                CancellationToken.None)).TotalCount
            .Should().Be(0);

        var ramStore = new RamReadStore(_db, _mapper);
        (await ramStore.ListAsync(new PagedRequest(), CancellationToken.None)).Items
            .Should().ContainSingle(x => x.Name == "Fury");
        (await ramStore.FilterAsync(
                new PagedRequest<RamFilter>(new RamFilter
                {
                    Name = "Fury",
                    ManufacturerId = _manufacturer.Id,
                    DdrGeneration = DdrGeneration.Ddr5
                }),
                CancellationToken.None)).Items
            .Should().ContainSingle();
        (await ramStore.GetByIdAsync(ram.Id, CancellationToken.None))!.ModulesCount.Should().Be(2);
        (await ramStore.FilterAsync(
                new PagedRequest<RamFilter>(new RamFilter { CpuId = Guid.NewGuid() }),
                CancellationToken.None)).TotalCount
            .Should().Be(0);

        var gpuStore = new GraphicsCardReadStore(_db, _mapper);
        (await gpuStore.ListAsync(new PagedRequest(), CancellationToken.None)).Items
            .Should().ContainSingle(x => x.Name == "TUF 4070");
        (await gpuStore.FilterAsync(
                new PagedRequest<GraphicsCardFilter>(new GraphicsCardFilter
                {
                    Name = "TUF",
                    ManufacturerId = _manufacturer.Id,
                    GpuId = _gpu.Id
                }),
                CancellationToken.None)).Items
            .Should().ContainSingle();
        (await gpuStore.GetByIdAsync(card.Id, CancellationToken.None))!.VideoMemoryGb.Should().Be(12);
        (await gpuStore.FilterAsync(
                new PagedRequest<GraphicsCardFilter>(new GraphicsCardFilter { ChassisId = Guid.NewGuid() }),
                CancellationToken.None)).TotalCount
            .Should().Be(0);
        var gpuCase = SeedChassis("4000D-GPU");
        (await gpuStore.FilterAsync(
                new PagedRequest<GraphicsCardFilter>(new GraphicsCardFilter { ChassisId = gpuCase.Id }),
                CancellationToken.None)).Items
            .Should()
            .ContainSingle(x =>
                x.Name == "TUF 4070"
                && x.ManufacturerName == "ASUS"
                && x.GpuName == "RTX 4070");

        var driveStore = new StorageDriveReadStore(_db, _mapper);
        (await driveStore.ListAsync(new PagedRequest(), CancellationToken.None)).Items
            .Should().ContainSingle(x => x.Name == "MX500");
        (await driveStore.FilterAsync(
                new PagedRequest<StorageDriveFilter>(new StorageDriveFilter
                {
                    Name = "MX",
                    Media = StorageMedia.Ssd
                }),
                CancellationToken.None)).Items
            .Should().ContainSingle();
        (await driveStore.GetByIdAsync(drive.Id, CancellationToken.None))!.CapacityGb.Should().Be(1000);
        (await driveStore.GetByIdAsync(drive.Id, CancellationToken.None))!.M2FormFactor.Should().BeNull();

        var nvme = new StorageDrive(
            "990 PRO",
            _manufacturer.Id,
            new StorageDriveSpecs
            {
                Media = StorageMedia.Ssd,
                Interface = StorageInterface.Nvme,
                FormFactor = StorageFormFactor.M22280,
                CapacityGb = 2000,
                PcieGeneration = PcieGeneration.Gen4
            });
        _db.StorageDrives.Add(nvme);
        _db.SaveChanges();
        var listedNvme = (await driveStore.ListAsync(new PagedRequest(), CancellationToken.None)).Items
            .Should()
            .ContainSingle(x => x.Name == "990 PRO")
            .Subject;
        listedNvme.IsM2.Should().BeTrue();
        listedNvme.M2FormFactor.Should().Be(M2FormFactor.M22280);

        var fanStore = new ChassisFanReadStore(_db, _mapper);
        (await fanStore.ListAsync(new PagedRequest(), CancellationToken.None)).Items
            .Should().ContainSingle(x => x.Name == "AF120");
        (await fanStore.FilterAsync(
                new PagedRequest<ChassisFanFilter>(new ChassisFanFilter("AF", _manufacturer.Id, FanDiameterMm.Mm120)),
                CancellationToken.None)).Items
            .Should().ContainSingle();
        (await fanStore.GetByIdAsync(fan.Id, CancellationToken.None))!.FansCountPerPack.Should().Be(3);
        (await fanStore.FilterAsync(
                new PagedRequest<ChassisFanFilter>(new ChassisFanFilter(ChassisId: Guid.NewGuid())),
                CancellationToken.None)).TotalCount
            .Should().Be(0);

        var coolerStore = new CpuCoolerReadStore(_db, _mapper);
        (await coolerStore.ListAsync(new PagedRequest(), CancellationToken.None)).Items
            .Should().ContainSingle(x => x.Name == "NH-D15");
        (await coolerStore.FilterAsync(
                new PagedRequest<CpuCoolerFilter>(new CpuCoolerFilter
                {
                    Name = "NH",
                    ManufacturerId = _manufacturer.Id,
                    Type = CpuCoolerType.Air
                }),
                CancellationToken.None)).Items
            .Should().ContainSingle();
        (await coolerStore.GetByIdAsync(cooler.Id, CancellationToken.None))!.MaxTdp.Should().Be(220);
        (await coolerStore.ListCpuCoolerSockets(cooler.Id, CancellationToken.None)).Should().ContainSingle();
        (await coolerStore.FilterAsync(
                new PagedRequest<CpuCoolerFilter>(new CpuCoolerFilter { MotherboardId = Guid.NewGuid() }),
                CancellationToken.None)).TotalCount
            .Should().Be(0);

        var wiredStore = new WiredNetworkAdapterReadStore(_db, _mapper);
        (await wiredStore.ListAsync(new PagedRequest(), CancellationToken.None)).Items
            .Should().ContainSingle(x => x.Name == "I225-V");
        (await wiredStore.FilterAsync(
                new PagedRequest<WiredNetworkAdapterFilter>(new WiredNetworkAdapterFilter
                {
                    Name = "I225",
                    HostInterface = WiredHostInterface.Pcie
                }),
                CancellationToken.None)).Items
            .Should().ContainSingle();
        (await wiredStore.GetByIdAsync(wired.Id, CancellationToken.None))!.MaxSpeedMbps.Should().Be(2500);
        (await wiredStore.FilterAsync(
                new PagedRequest<WiredNetworkAdapterFilter>(
                    new WiredNetworkAdapterFilter { MotherboardId = Guid.NewGuid() }),
                CancellationToken.None)).TotalCount
            .Should().Be(0);

        var wirelessStore = new WirelessNetworkAdapterReadStore(_db, _mapper);
        (await wirelessStore.ListAsync(new PagedRequest(), CancellationToken.None)).Items
            .Should().ContainSingle(x => x.Name == "AX210");
        (await wirelessStore.FilterAsync(
                new PagedRequest<WirelessNetworkAdapterFilter>(new WirelessNetworkAdapterFilter
                {
                    Name = "AX",
                    WifiStandard = WifiStandard.Wifi6E
                }),
                CancellationToken.None)).Items
            .Should().ContainSingle();
        (await wirelessStore.GetByIdAsync(wireless.Id, CancellationToken.None))!.MaxSpeedMbps.Should().Be(2400);
        (await wirelessStore.FilterAsync(
                new PagedRequest<WirelessNetworkAdapterFilter>(
                    new WirelessNetworkAdapterFilter { MotherboardId = Guid.NewGuid() }),
                CancellationToken.None)).TotalCount
            .Should().Be(0);
    }

    private Motherboard SeedMotherboard(string name)
    {
        var board = new Motherboard(
            _manufacturer.Id,
            name,
            new MotherboardSpecs
            {
                SocketId = _socket.Id,
                ChipsetId = _chipset.Id,
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
                WifiEnabled = true,
                BluetoothEnabled = false
            });
        board.AddPcieSlot(new MotherboardPcie(
            board.Id, PcieSlotType.X16, PcieSlotLane.X16, PcieGeneration.Gen4, 1));
        var m2 = new MotherboardM2(board.Id, M2Key.M, PcieGeneration.Gen4, 1, false);
        m2.AddFormFactor(new MotherboardM2FormFactor(m2.Id, M2FormFactor.M22280));
        board.AddM2Slot(m2);
        board.AddUsbPort(new MotherboardUsb(board.Id, UsbVersion.Usb32Gen2, UsbType.TypeA, 4));
        _db.Motherboards.Add(board);
        _db.SaveChanges();
        return board;
    }

    private Chassis SeedChassis(string name, params MbFormFactor[] mbFormFactors)
    {
        var chassis = new Chassis(
            name,
            _manufacturer.Id,
            new ChassisSpecs
            {
                LengthMm = 450,
                WidthMm = 230,
                HeightMm = 460,
                MotherboardMaxWidthMm = 305,
                MotherboardMaxHeightMm = 305,
                MaxCpuCoolerHeightMm = 170,
                MaxGraphicsCardLengthMm = 370,
                MaxPsuLengthMm = 180
            });
        chassis.AddDriveBay(new ChassisDriveBay(chassis.Id, DriveBayFormFactor.Inch35, 2));
        var mount = new ChassisFanMount(chassis.Id, FanMountLocation.Front, false);
        mount.AddOption(new ChassisFanMountOption(mount.Id, FanDiameterMm.Mm120, 3));
        chassis.AddFanMount(mount);
        chassis.AddPcieSlot(new ChassisPcieSlot(chassis.Id, false, 7, PcieOrientation.Horizontal));
        chassis.AddRadiator(new ChassisRadiator(chassis.Id, RadiatorLength.Mm360, RadiatorMountLocation.Top, 1));
        foreach (var formFactor in (mbFormFactors.Length > 0 ? mbFormFactors : [MbFormFactor.Atx]).Distinct())
            chassis.AddMbFormFactor(new ChassisMbFormFactor(chassis.Id, formFactor));
        chassis.AddPsuFormFactor(new ChassisPsuFormFactor(chassis.Id, PsuFormFactor.Atx));
        _db.Chassis.Add(chassis);
        _db.SaveChanges();
        return chassis;
    }

    private Cpu SeedCpu(string name)
    {
        var cpu = new Cpu(
            name,
            _manufacturer.Id,
            new CpuSpecs
            {
                SocketId = _socket.Id,
                SeriesId = _cpuSeries.Id,
                MaxMemoryGb = 128,
                ThermalDesignPower = 120,
                PowerConsumptionWatts = 120
            });
        cpu.AddRamCompat(new CpuRamCompat(cpu.Id, DdrGeneration.Ddr5, 2, RamRank.DualRank, 5200));
        cpu.AddSupportedChipset(new CpuSupportChipset(cpu.Id, _chipset.Id, false));
        _db.Cpus.Add(cpu);
        _db.SaveChanges();
        return cpu;
    }

    private Psu SeedPsu(string name)
    {
        var psu = new Psu(
            name,
            _manufacturer.Id,
            new PsuSpecs
            {
                Wattage = 850,
                Modularity = PsuModularity.FullModular,
                FormFactor = PsuFormFactor.Atx,
                LengthMm = 160,
                WidthMm = 150,
                HeightMm = 86
            });
        psu.AddCable(new PsuCable(psu.Id, PsuCableType.Motherboard24Pin, 1, 1));
        _db.Psus.Add(psu);
        _db.SaveChanges();
        return psu;
    }

    private Ram SeedRam(string name)
    {
        var ram = new Ram(
            name,
            _manufacturer.Id,
            new RamSpecs
            {
                Color = "Black",
                DdrGeneration = DdrGeneration.Ddr5,
                RamFormFactor = RamFormFactor.UDimm,
                RamRank = RamRank.DualRank,
                MemorySizePerStickGb = 16,
                TotalMemorySizeGb = 32,
                ModulesCount = 2,
                MaxMemorySpeedMts = 6000,
                HeightMm = 40
            });
        _db.Rams.Add(ram);
        _db.SaveChanges();
        return ram;
    }

    private GraphicsCard SeedGraphicsCard(string name)
    {
        var card = new GraphicsCard(
            name,
            _manufacturer.Id,
            new GraphicsCardSpecs
            {
                GpuId = _gpu.Id,
                VideoMemoryGb = 12,
                PcieSlotsUsed = 2,
                PcieGeneration = PcieGeneration.Gen4,
                LengthMm = 300,
                WidthMm = 120,
                HeightMm = 50,
                PowerConsumptionWatts = 200,
                PowerConnectorType = PsuCableType.Pcie6Plus2Pin,
                PowerConnectorCount = 2
            });
        _db.GraphicsCards.Add(card);
        _db.SaveChanges();
        return card;
    }

    private StorageDrive SeedStorage(string name)
    {
        var drive = new StorageDrive(
            name,
            _manufacturer.Id,
            new StorageDriveSpecs
            {
                Media = StorageMedia.Ssd,
                Interface = StorageInterface.Sata,
                FormFactor = StorageFormFactor.Sata25,
                CapacityGb = 1000
            });
        _db.StorageDrives.Add(drive);
        _db.SaveChanges();
        return drive;
    }

    private ChassisFan SeedChassisFan(string name)
    {
        var fan = new ChassisFan(name, _manufacturer.Id, FanDiameterMm.Mm120, 3);
        _db.ChassisFans.Add(fan);
        _db.SaveChanges();
        return fan;
    }

    private CpuCooler SeedCpuCooler(string name)
    {
        var cooler = new CpuCooler(_manufacturer.Id, name, 220, CpuCoolerType.Air, 165, 32, null);
        cooler.AddCpuCoolerSocket(new CpuCoolerSocket(cooler.Id, _socket.Id));
        _db.CpuCoolers.Add(cooler);
        _db.SaveChanges();
        return cooler;
    }

    private WiredNetworkAdapter SeedWiredNic(string name)
    {
        var adapter = new WiredNetworkAdapter(
            name, _manufacturer.Id, WiredHostInterface.Pcie, 2500, pcieSlotType: PcieSlotType.X1);
        _db.WiredNetworkAdapters.Add(adapter);
        _db.SaveChanges();
        return adapter;
    }

    private WirelessNetworkAdapter SeedWirelessNic(string name)
    {
        var adapter = new WirelessNetworkAdapter(
            name,
            _manufacturer.Id,
            new WirelessNetworkAdapterSpecs
            {
                WifiStandard = WifiStandard.Wifi6E,
                HostInterface = WirelessHostInterface.M2,
                MaxSpeedMbps = 2400,
                BluetoothVersion = BluetoothVersion.V5Point2,
                M2Key = M2Key.E,
                M2FormFactor = M2FormFactor.M22230
            });
        _db.WirelessNetworkAdapters.Add(adapter);
        _db.SaveChanges();
        return adapter;
    }
}
