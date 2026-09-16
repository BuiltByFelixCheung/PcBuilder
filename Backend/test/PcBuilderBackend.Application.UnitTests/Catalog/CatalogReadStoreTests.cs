using AutoMapper;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using PcBuilderBackend.Application.Catalog.Chassis.Dto;
using PcBuilderBackend.Application.Catalog.Motherboards.Dto;
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
        _db.Chipsets.Add(_chipset);
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
                SupportedMbFormFactors = [MbFormFactor.Atx]
            }),
            CancellationToken.None);
        filtered.Items.Should().ContainSingle();

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

    private Chassis SeedChassis(string name)
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
        chassis.AddMbFormFactor(new ChassisMbFormFactor(chassis.Id, MbFormFactor.Atx));
        chassis.AddPsuFormFactor(new ChassisPsuFormFactor(chassis.Id, PsuFormFactor.Atx));
        _db.Chassis.Add(chassis);
        _db.SaveChanges();
        return chassis;
    }
}
