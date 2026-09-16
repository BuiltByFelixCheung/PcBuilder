using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using PcBuilderBackend.Application.Catalog.Motherboards.Commands.BulkCreateMotherboards;
using PcBuilderBackend.Application.Catalog.Motherboards.Dto;
using PcBuilderBackend.Application.Catalog.Motherboards.Validators;
using PcBuilderBackend.Application.UnitTests.Support;
using PcBuilderBackend.Domain.Enums;

namespace PcBuilderBackend.Application.UnitTests.Catalog;

public class MotherboardBulkCreateTests : IDisposable
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
    public async Task Validator_requires_items_and_rejects_duplicates()
    {
        var validator = new BulkCreateMotherboardsCommandValidator(_fx.Lookup);

        (await validator.ValidateAsync(new BulkCreateMotherboardCommand([]))).IsValid.Should().BeFalse();
        (await validator.ValidateAsync(new BulkCreateMotherboardCommand([ValidBoard()]))).IsValid.Should().BeTrue();

        var duplicateM2 = ValidBoard() with
        {
            M2Slots =
            [
                M2(false, M2FormFactor.M22280),
                M2(false, M2FormFactor.M22280)
            ]
        };
        (await validator.ValidateAsync(new BulkCreateMotherboardCommand([duplicateM2])))
            .IsValid.Should().BeFalse();
    }

    [Fact]
    public async Task Handler_inserts_boards_with_child_slots()
    {
        var motherboards = new TestMotherboardRepository(_fx.Context);
        var handler = new BulkCreateMotherboardsHandler(motherboards, _fx.UnitOfWork, _fx.Mapper);

        var result = await handler.Handle(
            new BulkCreateMotherboardCommand([ValidBoard("X870-E"), ValidBoard("B650")]),
            CancellationToken.None);

        result.Should().HaveCount(2);
        result.Select(x => x.Name).Should().BeEquivalentTo("X870-E", "B650");
        result.Should().AllSatisfy(board =>
        {
            board.PcieSlots.Should().ContainSingle();
            board.M2Slots.Should().ContainSingle();
            board.UsbPorts.Should().ContainSingle();
        });
        (await _fx.Context.Motherboards.CountAsync()).Should().Be(2);
    }

    private MotherboardDto ValidBoard(string name = "B650") => new()
    {
        Name = name,
        ManufacturerId = _fx.Manufacturer.Id,
        SocketId = _fx.Socket.Id,
        ChipsetId = _fx.Chipset.Id,
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
        BluetoothEnabled = false,
        PcieSlots =
        [
            new MotherboardPcieDto
            {
                SlotType = PcieSlotType.X16,
                SlotLanes = PcieSlotLane.X16,
                Generation = PcieGeneration.Gen4,
                SlotCount = 1
            }
        ],
        M2Slots = [M2(false, M2FormFactor.M22280)],
        UsbPorts =
        [
            new MotherboardUsbDto
            {
                UsbVersion = UsbVersion.Usb32Gen2,
                UsbType = UsbType.TypeA,
                PortCount = 4
            }
        ]
    };

    private static MotherboardM2Dto M2(bool supportsSata, M2FormFactor formFactor) => new()
    {
        Key = M2Key.M,
        PcieGeneration = PcieGeneration.Gen4,
        SlotCount = 1,
        SupportsSata = supportsSata,
        FormFactors = [formFactor]
    };
}
