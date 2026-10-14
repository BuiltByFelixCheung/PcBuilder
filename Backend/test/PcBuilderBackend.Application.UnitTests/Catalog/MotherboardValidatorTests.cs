using FluentAssertions;
using PcBuilderBackend.Application.Catalog.Motherboards.Commands.BulkUpdateMotherboardM2Slots;
using PcBuilderBackend.Application.Catalog.Motherboards.Commands.CreateMotherboard;
using PcBuilderBackend.Application.Catalog.Motherboards.Dto;
using PcBuilderBackend.Application.Catalog.Motherboards.Validators;
using PcBuilderBackend.Application.UnitTests.Support;
using PcBuilderBackend.Domain.Enums;

namespace PcBuilderBackend.Application.UnitTests.Catalog;

public class MotherboardValidatorTests : IDisposable
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
    public async Task Create_allows_m2_groups_that_differ_by_sata_or_form_factor()
    {
        var validator = new CreateMotherboardCommandValidator(_fx.Lookup);
        var command = ValidCreate() with
        {
            M2Slots =
            [
                M2(supportsSata: false, M2FormFactor.M22280),
                M2(supportsSata: true, M2FormFactor.M22280),
                M2(supportsSata: false, M2FormFactor.M222110)
            ]
        };

        (await validator.ValidateAsync(command)).IsValid.Should().BeTrue();
    }

    [Fact]
    public async Task Create_rejects_identical_m2_groups()
    {
        var validator = new CreateMotherboardCommandValidator(_fx.Lookup);
        var command = ValidCreate() with
        {
            M2Slots =
            [
                M2(supportsSata: false, M2FormFactor.M22280),
                M2(supportsSata: false, M2FormFactor.M22280)
            ]
        };

        var result = await validator.ValidateAsync(command);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage.Contains("Duplicate M.2"));
    }

    [Fact]
    public async Task Bulk_update_rejects_identical_m2_groups()
    {
        var validator = new BulkUpdateMotherboardM2SlotsCommandValidator();
        var command = new BulkUpdateMotherboardM2SlotsCommand(
            Guid.NewGuid(),
            [
                M2(supportsSata: true, M2FormFactor.M22280),
                M2(supportsSata: true, M2FormFactor.M22280)
            ]);

        var result = await validator.ValidateAsync(command);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage.Contains("Duplicate M.2"));
    }

    private CreateMotherboardCommand ValidCreate() => new()
    {
        Name = "B650",
        ManufacturerId = _fx.Manufacturer.Id,
        SocketId = _fx.Socket.Id,
        ChipsetId = _fx.Chipset.Id,
        RamSlots = 4,
        MaxMemoryGb = 128,
        MaxDimmSizeGb = 48,
        SataPorts = 4,
        PwmFanHeaders = 4,
        DcFanHeaders = 0,
        EpsConnectors = 2,
        WidthMm = 244,
        HeightMm = 305,
        DdrGeneration = DdrGeneration.Ddr5,
        RamFormFactor = RamFormFactor.UDimm,
        FormFactor = MbFormFactor.Atx,
        PcieSlots = [new MotherboardPcieDto { SlotType = PcieSlotType.X16, SlotLanes = PcieSlotLane.X16, Generation = PcieGeneration.Gen4, SlotCount = 1 }],
        M2Slots = [M2(supportsSata: false, M2FormFactor.M22280)],
        UsbPorts = [new MotherboardUsbDto { UsbVersion = UsbVersion.Usb32Gen2, UsbType = UsbType.TypeA, PortCount = 4 }]
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
