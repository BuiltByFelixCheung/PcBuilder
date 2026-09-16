using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using PcBuilderBackend.Application.Catalog.Chassis.Commands.BulkCreateChassis;
using PcBuilderBackend.Application.Catalog.Chassis.Dto;
using PcBuilderBackend.Application.Catalog.Chassis.Validators;
using PcBuilderBackend.Application.UnitTests.Support;
using PcBuilderBackend.Domain.Enums;

namespace PcBuilderBackend.Application.UnitTests.Catalog;

public class ChassisBulkCreateTests : IDisposable
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
    public async Task Validator_requires_items_and_positive_dimensions()
    {
        var validator = new BulkCreateChassisCommandValidator(_fx.Lookup);

        (await validator.ValidateAsync(new BulkCreateChassisCommand([]))).IsValid.Should().BeFalse();
        (await validator.ValidateAsync(new BulkCreateChassisCommand([ValidItem()]))).IsValid.Should().BeTrue();
        (await validator.ValidateAsync(new BulkCreateChassisCommand([ValidItem() with { LengthMm = 0 }])))
            .IsValid.Should().BeFalse();
    }

    [Fact]
    public async Task Handler_inserts_chassis_with_child_collections()
    {
        var chassis = new TestChassisRepository(_fx.Context);
        var handler = new BulkCreateChassisHandler(
            chassis, _fx.UnitOfWork, _fx.Mapper, NullLogger<BulkCreateChassisHandler>.Instance);

        var result = await handler.Handle(
            new BulkCreateChassisCommand([ValidItem("4000D"), ValidItem("5000D")]),
            CancellationToken.None);

        result.Should().HaveCount(2);
        result.Select(x => x.Name).Should().BeEquivalentTo("4000D", "5000D");
        result.Should().AllSatisfy(item =>
        {
            item.MbFormFactors.Should().Contain(MbFormFactor.Atx);
            item.PsuFormFactors.Should().Contain(PsuFormFactor.Atx);
            item.DriveBays.Should().ContainSingle();
            item.FanMounts.Should().ContainSingle();
        });
        (await _fx.Context.Chassis.CountAsync()).Should().Be(2);
    }

    private CreateChassisItem ValidItem(string name = "4000D") => new()
    {
        Name = name,
        ManufacturerId = _fx.Manufacturer.Id,
        LengthMm = 450,
        WidthMm = 230,
        HeightMm = 460,
        MotherboardMaxWidthMm = 305,
        MotherboardMaxHeightMm = 244,
        MaxCpuCoolerHeightMm = 170,
        MaxGraphicsCardLengthMm = 370,
        MaxPsuLengthMm = 180,
        PsuFormFactors = [PsuFormFactor.Atx],
        MbFormFactors = [MbFormFactor.Atx],
        DriveBays = [new ChassisDriveBayDto(DriveBayFormFactor.Inch35, 2)],
        FanMounts =
        [
            new ChassisFanMountDto(
                FanMountLocation.Front,
                false,
                [new ChassisFanMountOptionDto(FanDiameterMm.Mm120, 3)])
        ],
        PcieSlots = [new ChassisPcieSlotDto(false, 7, PcieOrientation.Horizontal)],
        Radiators =
        [
            new ChassisRadiatorDto
            {
                Length = RadiatorLength.Mm360,
                Location = RadiatorMountLocation.Top,
                RadiatorCount = 1
            }
        ]
    };
}
