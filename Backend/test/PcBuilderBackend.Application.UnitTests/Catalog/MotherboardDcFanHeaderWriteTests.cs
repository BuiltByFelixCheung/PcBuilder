using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;
using PcBuilderBackend.Application.Catalog.Motherboards.Commands.BulkUpdateMotherboards;
using PcBuilderBackend.Application.Catalog.Motherboards.Commands.CreateMotherboard;
using PcBuilderBackend.Application.Catalog.Motherboards.Commands.ImportMotherboards;
using PcBuilderBackend.Application.Catalog.Motherboards.Commands.UpdateMotherboard;
using PcBuilderBackend.Application.Catalog.Motherboards.Dto;
using PcBuilderBackend.Application.Common.Interfaces;
using PcBuilderBackend.Application.UnitTests.Support;
using PcBuilderBackend.Domain.Entities;
using PcBuilderBackend.Domain.Enums;

namespace PcBuilderBackend.Application.UnitTests.Catalog;

public class MotherboardDcFanHeaderWriteTests : IDisposable
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
    public async Task Create_persists_dc_headers_and_compatibility_uses_them()
    {
        var created = await new CreateMotherboardHandler(
                new TestMotherboardRepository(_fx.Context), _fx.UnitOfWork, _fx.Mapper)
            .Handle(CreateCommand(pwm: 1, dc: 2), CancellationToken.None);

        created.PwmFanHeaders.Should().Be(1);
        created.DcFanHeaders.Should().Be(2);

        var stored = await _fx.Context.Motherboards.SingleAsync(x => x.Id == created.Id);
        stored.PwmFanHeaders.Should().Be(1);
        stored.DcFanHeaders.Should().Be(2);

        // DC fans fill DC headers first, then leftover PWM. PWM fans cannot use DC headers.
        var dc = Fan(FanHeaderType.ThreePinDc);
        stored.CheckFanHeaderCompatibility([dc, dc, dc]).Status.Should().Be(PartsCompatibility.Compatible);
        stored.CheckFanHeaderCompatibility([dc, dc, dc, dc]).Reason
            .Should().Be(CompatibilityReason.InsufficientFanHeaders);

        var pwm = Fan(FanHeaderType.FourPinPwm);
        stored.CheckFanHeaderCompatibility(pwm).Status.Should().Be(PartsCompatibility.Compatible);
        stored.CheckFanHeaderCompatibility([pwm, pwm]).Reason
            .Should().Be(CompatibilityReason.InsufficientFanHeaders);
    }

    [Fact]
    public async Task Create_persists_a_dc_only_board()
    {
        var created = await new CreateMotherboardHandler(
                new TestMotherboardRepository(_fx.Context), _fx.UnitOfWork, _fx.Mapper)
            .Handle(CreateCommand(pwm: 0, dc: 2), CancellationToken.None);

        created.PwmFanHeaders.Should().Be(0);
        created.DcFanHeaders.Should().Be(2);

        var stored = await _fx.Context.Motherboards.SingleAsync(x => x.Id == created.Id);
        var dc = Fan(FanHeaderType.ThreePinDc);
        stored.CheckFanHeaderCompatibility([dc, dc]).Status.Should().Be(PartsCompatibility.Compatible);
        stored.CheckFanHeaderCompatibility(Fan(FanHeaderType.FourPinPwm)).Reason
            .Should().Be(CompatibilityReason.InsufficientFanHeaders);
    }

    [Fact]
    public async Task Update_replaces_dc_headers_and_compatibility_follows()
    {
        var motherboards = new TestMotherboardRepository(_fx.Context);
        var created = await new CreateMotherboardHandler(motherboards, _fx.UnitOfWork, _fx.Mapper)
            .Handle(CreateCommand(pwm: 4, dc: 1), CancellationToken.None);

        var updated = await new UpdateMotherboardHandler(motherboards, _fx.UnitOfWork, _fx.Mapper)
            .Handle(UpdateCommand(created.Id, pwm: 0, dc: 3), CancellationToken.None);

        updated.Should().NotBeNull();
        updated!.PwmFanHeaders.Should().Be(0);
        updated.DcFanHeaders.Should().Be(3);

        var stored = await _fx.Context.Motherboards.SingleAsync(x => x.Id == created.Id);
        stored.DcFanHeaders.Should().Be(3);
        var dc = Fan(FanHeaderType.ThreePinDc);
        stored.CheckFanHeaderCompatibility([dc, dc, dc]).Status.Should().Be(PartsCompatibility.Compatible);
        stored.CheckFanHeaderCompatibility([dc, dc, dc, dc]).Reason
            .Should().Be(CompatibilityReason.InsufficientFanHeaders);
        stored.CheckFanHeaderCompatibility(Fan(FanHeaderType.FourPinPwm)).Reason
            .Should().Be(CompatibilityReason.InsufficientFanHeaders);
    }

    [Fact]
    public async Task Bulk_update_persists_dc_headers()
    {
        var motherboards = new TestMotherboardRepository(_fx.Context);
        var created = await new CreateMotherboardHandler(motherboards, _fx.UnitOfWork, _fx.Mapper)
            .Handle(CreateCommand(pwm: 2, dc: 0, name: "B650"), CancellationToken.None);

        var updated = await new BulkUpdateMotherboardsHandler(
                motherboards,
                _fx.UnitOfWork,
                NullLogger<BulkUpdateMotherboardsHandler>.Instance,
                _fx.Mapper)
            .Handle(
                new BulkUpdateMotherboardsCommand([UpdateCommand(created.Id, pwm: 1, dc: 4, name: "B650")]),
                CancellationToken.None);

        updated.Should().ContainSingle();
        updated![0].PwmFanHeaders.Should().Be(1);
        updated[0].DcFanHeaders.Should().Be(4);

        var stored = await _fx.Context.Motherboards.SingleAsync(x => x.Id == created.Id);
        stored.DcFanHeaders.Should().Be(4);
        var dc = Fan(FanHeaderType.ThreePinDc);
        stored.CheckFanHeaderCompatibility([dc, dc, dc, dc, dc]).Status
            .Should().Be(PartsCompatibility.Compatible);
        stored.CheckFanHeaderCompatibility([dc, dc, dc, dc, dc, dc]).Reason
            .Should().Be(CompatibilityReason.InsufficientFanHeaders);
    }

    [Fact]
    public async Task Import_persists_dc_headers_used_by_compatibility()
    {
        var excel = Substitute.For<IExcelImportService>();
        excel.ParseMotherboardImportAsync(Arg.Any<Stream>(), Arg.Any<CancellationToken>())
            .Returns([ImportRow(pwm: 0, dc: 2)]);

        var imported = await new ImportMotherboardsHandler(
                new TestMotherboardRepository(_fx.Context),
                _fx.UnitOfWork,
                _fx.Lookup,
                excel,
                _fx.Mapper,
                NullLogger<ImportMotherboardsHandler>.Instance)
            .Handle(new ImportMotherboardsCommand(Stream.Null), CancellationToken.None);

        imported.Should().ContainSingle();
        imported[0].PwmFanHeaders.Should().Be(0);
        imported[0].DcFanHeaders.Should().Be(2);

        var stored = await _fx.Context.Motherboards.SingleAsync();
        var dc = Fan(FanHeaderType.ThreePinDc);
        stored.CheckFanHeaderCompatibility([dc, dc]).Status.Should().Be(PartsCompatibility.Compatible);
        stored.CheckFanHeaderCompatibility(Fan(FanHeaderType.FourPinPwm)).Reason
            .Should().Be(CompatibilityReason.InsufficientFanHeaders);
    }

    private CreateMotherboardCommand CreateCommand(int pwm, int dc, string name = "B650") => new()
    {
        Name = name,
        ManufacturerId = _fx.Manufacturer.Id,
        SocketId = _fx.Socket.Id,
        ChipsetId = _fx.Chipset.Id,
        RamSlots = 4,
        MaxMemoryGb = 128,
        MaxDimmSizeGb = 48,
        SataPorts = 4,
        PwmFanHeaders = pwm,
        DcFanHeaders = dc,
        EpsConnectors = 2,
        WidthMm = 244,
        HeightMm = 305,
        DdrGeneration = DdrGeneration.Ddr5,
        RamFormFactor = RamFormFactor.UDimm,
        FormFactor = MbFormFactor.Atx
    };

    private UpdateMotherboardCommand UpdateCommand(Guid id, int pwm, int dc, string name = "B650") => new()
    {
        Id = id,
        Name = name,
        ManufacturerId = _fx.Manufacturer.Id,
        SocketId = _fx.Socket.Id,
        ChipsetId = _fx.Chipset.Id,
        RamSlots = 4,
        MaxMemoryGb = 128,
        MaxDimmSizeGb = 48,
        SataPorts = 4,
        PwmFanHeaders = pwm,
        DcFanHeaders = dc,
        EpsConnectors = 2,
        WidthMm = 244,
        HeightMm = 305,
        DdrGeneration = DdrGeneration.Ddr5,
        RamFormFactor = RamFormFactor.UDimm,
        FormFactor = MbFormFactor.Atx
    };

    private MotherboardImportRow ImportRow(int pwm, int dc) => new()
    {
        Name = "B650-E",
        ManufacturerId = _fx.Manufacturer.Id,
        SocketId = _fx.Socket.Id,
        ChipsetId = _fx.Chipset.Id,
        RamSlots = 4,
        MaxMemoryGb = 128,
        MaxDimmSizeGb = 48,
        SataPorts = 4,
        PwmFanHeaders = pwm,
        DcFanHeaders = dc,
        EpsConnectors = 2,
        WidthMm = 244,
        HeightMm = 305,
        DdrGeneration = DdrGeneration.Ddr5,
        RamFormFactor = RamFormFactor.UDimm,
        FormFactor = MbFormFactor.Atx
    };

    private ChassisFan Fan(FanHeaderType header) =>
        new("Fan", _fx.Manufacturer.Id, FanDiameterMm.Mm120, 1, 25m, header, false, null);
}
