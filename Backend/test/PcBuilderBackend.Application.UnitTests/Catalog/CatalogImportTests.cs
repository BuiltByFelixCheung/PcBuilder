using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;
using PcBuilderBackend.Application.Catalog.Chassis.Commands.ImportChassis;
using PcBuilderBackend.Application.Catalog.Chassis.Dto;
using PcBuilderBackend.Application.Catalog.Cpus.Commands.ImportCpu;
using PcBuilderBackend.Application.Catalog.Cpus.Dto;
using PcBuilderBackend.Application.Catalog.Motherboards.Commands.ImportMotherboards;
using PcBuilderBackend.Application.Catalog.Motherboards.Dto;
using PcBuilderBackend.Application.Common.Interfaces;
using PcBuilderBackend.Application.UnitTests.Support;
using PcBuilderBackend.Domain.Enums;

namespace PcBuilderBackend.Application.UnitTests.Catalog;

public class CatalogImportTests : IDisposable
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
    public async Task Import_chassis_creates_children_and_rejects_unknown_manufacturer()
    {
        var excel = Substitute.For<IExcelImportService>();
        excel.ParseChassisImportAsync(Arg.Any<Stream>(), Arg.Any<CancellationToken>())
            .Returns([ChassisRow(_fx.Manufacturer.Id)]);

        var handler = new ImportChassisHandler(
            new TestChassisRepository(_fx.Context),
            _fx.UnitOfWork,
            _fx.Lookup,
            excel,
            _fx.Mapper,
            NullLogger<ImportChassisHandler>.Instance);

        var imported = await handler.Handle(new ImportChassisCommand(Stream.Null), CancellationToken.None);
        imported.Should().ContainSingle(x => x.Name == "4000D");
        imported[0].DriveBays.Should().ContainSingle();
        imported[0].FanMounts.Should().ContainSingle();
        imported[0].MbFormFactors.Should().Contain(MbFormFactor.Atx);

        excel.ParseChassisImportAsync(Arg.Any<Stream>(), Arg.Any<CancellationToken>())
            .Returns([ChassisRow(Guid.NewGuid())]);
        var act = () => handler.Handle(new ImportChassisCommand(Stream.Null), CancellationToken.None);
        await act.Should().ThrowAsync<ArgumentException>().WithMessage("*Manufacturer*");
    }

    [Fact]
    public async Task Import_motherboards_creates_slots_and_rejects_unknown_chipset()
    {
        var excel = Substitute.For<IExcelImportService>();
        excel.ParseMotherboardImportAsync(Arg.Any<Stream>(), Arg.Any<CancellationToken>())
            .Returns([BoardRow(_fx.Manufacturer.Id, _fx.Socket.Id, _fx.Chipset.Id)]);

        var handler = new ImportMotherboardsHandler(
            new TestMotherboardRepository(_fx.Context),
            _fx.UnitOfWork,
            _fx.Lookup,
            excel,
            _fx.Mapper,
            NullLogger<ImportMotherboardsHandler>.Instance);

        var imported = await handler.Handle(new ImportMotherboardsCommand(Stream.Null), CancellationToken.None);
        imported.Should().ContainSingle(x => x.Name == "B650-E");
        imported[0].PcieSlots.Should().ContainSingle();
        imported[0].M2Slots.Should().ContainSingle();
        imported[0].UsbPorts.Should().ContainSingle();

        excel.ParseMotherboardImportAsync(Arg.Any<Stream>(), Arg.Any<CancellationToken>())
            .Returns([BoardRow(_fx.Manufacturer.Id, _fx.Socket.Id, Guid.NewGuid())]);
        var act = () => handler.Handle(new ImportMotherboardsCommand(Stream.Null), CancellationToken.None);
        await act.Should().ThrowAsync<ArgumentException>().WithMessage("*Chipset*");
    }

    [Fact]
    public async Task Import_cpus_creates_compats_and_rejects_unknown_series()
    {
        var excel = Substitute.For<IExcelImportService>();
        excel.ParseCpuImportAsync(Arg.Any<Stream>(), Arg.Any<CancellationToken>())
            .Returns([CpuRow(_fx.Manufacturer.Id, _fx.Socket.Id, _fx.CpuSeries.Id, _fx.Chipset.Id)]);

        var handler = new ImportCpusHandler(
            _fx.Cpus,
            _fx.UnitOfWork,
            _fx.Lookup,
            excel,
            _fx.Mapper,
            NullLogger<ImportCpusHandler>.Instance);

        var imported = await handler.Handle(new ImportCpusCommand(Stream.Null), CancellationToken.None);
        imported.Should().ContainSingle(x => x.Name == "7800X3D");
        imported[0].RamCompats.Should().ContainSingle();
        imported[0].SupportChipsets.Should().ContainSingle();

        excel.ParseCpuImportAsync(Arg.Any<Stream>(), Arg.Any<CancellationToken>())
            .Returns([CpuRow(_fx.Manufacturer.Id, _fx.Socket.Id, Guid.NewGuid(), _fx.Chipset.Id)]);
        var act = () => handler.Handle(new ImportCpusCommand(Stream.Null), CancellationToken.None);
        await act.Should().ThrowAsync<ArgumentException>().WithMessage("*CPU series*");
    }

    private static ChassisImportRow ChassisRow(Guid manufacturerId) => new()
    {
        RowNumber = 2,
        Name = "4000D",
        ManufacturerId = manufacturerId,
        LengthMm = 450,
        WidthMm = 230,
        HeightMm = 460,
        MotherboardMaxWidthMm = 305,
        MotherboardMaxHeightMm = 244,
        MaxCpuCoolerHeightMm = 170,
        MaxGraphicsCardLengthMm = 370,
        MaxPsuLengthMm = 180,
        DriveBays = [new ChassisDriveBayImportRow { FormFactor = DriveBayFormFactor.Inch35, SlotCount = 2 }],
        FanMounts =
        [
            new ChassisFanMountImportRow
            {
                Location = FanMountLocation.Front,
                Options = [new ChassisFanMountOptionImportRow { Diameter = FanDiameterMm.Mm120, SlotCount = 3 }]
            }
        ],
        PcieSlots =
        [
            new ChassisPcieSlotImportRow
            {
                LowProfileSlots = false,
                SlotCount = 7,
                Orientation = PcieOrientation.Horizontal
            }
        ],
        Radiators =
        [
            new ChassisRadiatorImportRow
            {
                Length = RadiatorLength.Mm360,
                Location = RadiatorMountLocation.Top,
                RadiatorCount = 1
            }
        ],
        MbFormFactors = [new ChassisMbFormFactorImportRow { MbFormFactor = MbFormFactor.Atx }],
        PsuFormFactors = [new ChassisPsuFormFactorImportRow { PsuFormFactor = PsuFormFactor.Atx }]
    };

    private static MotherboardImportRow BoardRow(Guid manufacturerId, Guid socketId, Guid chipsetId) => new()
    {
        Name = "B650-E",
        ManufacturerId = manufacturerId,
        SocketId = socketId,
        ChipsetId = chipsetId,
        RamSlots = 4,
        MaxMemoryGb = 128,
        MaxDimmSizeGb = 48,
        SataPorts = 4,
        FanConnectors = 4,
        EpsConnectors = 2,
        WidthMm = 244,
        HeightMm = 305,
        DdrGeneration = DdrGeneration.Ddr5,
        RamFormFactor = RamFormFactor.UDimm,
        FormFactor = MbFormFactor.Atx,
        WifiEnabled = true,
        PcieSlots =
        [
            new MotherboardPcieImportRow
            {
                SlotType = PcieSlotType.X16,
                SlotLanes = PcieSlotLane.X16,
                Generation = PcieGeneration.Gen4,
                SlotCount = 1
            }
        ],
        M2Slots =
        [
            new MotherboardM2ImportRow
            {
                Key = M2Key.M,
                PcieGeneration = PcieGeneration.Gen4,
                SlotCount = 1,
                FormFactors = [M2FormFactor.M22280]
            }
        ],
        UsbPorts =
        [
            new MotherboardUsbImportRow
            {
                UsbVersion = UsbVersion.Usb32Gen2,
                UsbType = UsbType.TypeA,
                PortCount = 4
            }
        ]
    };

    private static CpuImportRow CpuRow(Guid manufacturerId, Guid socketId, Guid seriesId, Guid chipsetId) => new()
    {
        Name = "7800X3D",
        ManufacturerId = manufacturerId,
        SocketId = socketId,
        SeriesId = seriesId,
        MaxMemoryGb = 128,
        ThermalDesignPower = 120,
        PowerConsumptionWatts = 120,
        RamCompats =
        [
            new CpuRamCompactImportRow
            {
                DdrGeneration = DdrGeneration.Ddr5,
                RamModuleCount = 2,
                RamRank = RamRank.DualRank,
                MaxSpeedMts = 5200
            }
        ],
        SupportChipsets =
        [
            new CpuSupportChipsetImportRow { ChipsetId = chipsetId, RequiresBiosUpdate = false }
        ]
    };
}
