using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using PcBuilderBackend.Application.Catalog.Chassis.Commands.BulkUpdateChassisDriveBays;
using PcBuilderBackend.Application.Catalog.Chassis.Commands.BulkUpdateChassisFanMounts;
using PcBuilderBackend.Application.Catalog.Chassis.Commands.BulkUpdateChassisMbFormFactors;
using PcBuilderBackend.Application.Catalog.Chassis.Commands.BulkUpdateChassisPcieSlots;
using PcBuilderBackend.Application.Catalog.Chassis.Commands.BulkUpdateChassisPsuFormFactors;
using PcBuilderBackend.Application.Catalog.Chassis.Commands.BulkUpdateChassisRadiators;
using PcBuilderBackend.Application.Catalog.Chassis.Dto;
using PcBuilderBackend.Application.UnitTests.Support;
using PcBuilderBackend.Domain.Entities;
using PcBuilderBackend.Domain.Enums;
using PcBuilderBackend.Domain.ValueObjects;

namespace PcBuilderBackend.Application.UnitTests.Catalog;

public class ChassisChildBulkUpdateTests : IDisposable
{
    private readonly AppFixture _fx = new();
    private readonly TestChassisRepository _chassis;

    public ChassisChildBulkUpdateTests() => _chassis = new TestChassisRepository(_fx.Context);

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
    public async Task Child_bulk_updates_return_null_when_chassis_is_missing()
    {
        var id = Guid.NewGuid();

        (await DriveBays().Handle(new BulkUpdateChassisDriveBaysCommand(id, []), CancellationToken.None))
            .Should().BeNull();
        (await FanMounts().Handle(new BulkUpdateChassisFanMountsCommand(id, []), CancellationToken.None))
            .Should().BeNull();
        (await PcieSlots().Handle(new BulkUpdateChassisPcieSlotsCommand(id, []), CancellationToken.None))
            .Should().BeNull();
        (await Radiators().Handle(new BulkUpdateChassisRadiatorsCommand(id, []), CancellationToken.None))
            .Should().BeNull();
        (await MbFormFactors().Handle(new BulkUpdateChassisMbFormFactorsCommand(id, []), CancellationToken.None))
            .Should().BeNull();
        (await PsuFormFactors().Handle(new BulkUpdateChassisPsuFormFactorsCommand(id, []), CancellationToken.None))
            .Should().BeNull();
    }

    [Fact]
    public async Task Drive_bays_add_update_and_remove()
    {
        var chassis = SeedChassis();

        var result = await DriveBays().Handle(
            new BulkUpdateChassisDriveBaysCommand(chassis.Id,
            [
                new ChassisDriveBayDto(DriveBayFormFactor.Inch35, 4),
                new ChassisDriveBayDto(DriveBayFormFactor.Inch25, 2)
            ]),
            CancellationToken.None);

        result.Should().HaveCount(2);
        result.Should().Contain(x => x.FormFactor == DriveBayFormFactor.Inch35 && x.SlotCount == 4);
        result.Should().Contain(x => x.FormFactor == DriveBayFormFactor.Inch25);
    }

    [Fact]
    public async Task Fan_mounts_sync_locations_and_options()
    {
        var chassis = SeedChassis();

        var result = await FanMounts().Handle(
            new BulkUpdateChassisFanMountsCommand(chassis.Id,
            [
                new ChassisFanMountDto(
                    FanMountLocation.Front,
                    true,
                    [
                        new ChassisFanMountOptionDto(FanDiameterMm.Mm120, 2),
                        new ChassisFanMountOptionDto(FanDiameterMm.Mm140, 1)
                    ]),
                new ChassisFanMountDto(
                    FanMountLocation.Rear,
                    false,
                    [new ChassisFanMountOptionDto(FanDiameterMm.Mm120, 1)])
            ]),
            CancellationToken.None);

        result.Should().HaveCount(2);
        result.Should().Contain(x => x.Location == FanMountLocation.Front && x.SingleDiameterOnly);
        result.Should().Contain(x => x.Location == FanMountLocation.Rear);
        result!.Single(x => x.Location == FanMountLocation.Front).Options.Should().HaveCount(2);
    }

    [Fact]
    public async Task Remaining_child_collections_replace_by_key()
    {
        var chassis = SeedChassis();

        (await PcieSlots().Handle(
                new BulkUpdateChassisPcieSlotsCommand(chassis.Id,
                [
                    new ChassisPcieSlotDto(false, 3, PcieOrientation.Horizontal),
                    new ChassisPcieSlotDto(true, 2, PcieOrientation.Vertical)
                ]),
                CancellationToken.None))
            .Should().HaveCount(2);

        (await Radiators().Handle(
                new BulkUpdateChassisRadiatorsCommand(chassis.Id,
                [
                    new ChassisRadiatorDto
                    {
                        Length = RadiatorLength.Mm360,
                        Location = RadiatorMountLocation.Top,
                        RadiatorCount = 2
                    },
                    new ChassisRadiatorDto
                    {
                        Length = RadiatorLength.Mm240,
                        Location = RadiatorMountLocation.Front,
                        RadiatorCount = 1
                    }
                ]),
                CancellationToken.None))
            .Should().HaveCount(2);

        (await MbFormFactors().Handle(
                new BulkUpdateChassisMbFormFactorsCommand(
                    chassis.Id, [MbFormFactor.Atx, MbFormFactor.Matx]),
                CancellationToken.None))
            .Should().BeEquivalentTo([MbFormFactor.Atx, MbFormFactor.Matx]);

        (await PsuFormFactors().Handle(
                new BulkUpdateChassisPsuFormFactorsCommand(
                    chassis.Id, [PsuFormFactor.Atx, PsuFormFactor.Sfx]),
                CancellationToken.None))
            .Should().BeEquivalentTo([PsuFormFactor.Atx, PsuFormFactor.Sfx]);
    }

    private BulkUpdateChassisDriveBaysHandler DriveBays() =>
        new(_chassis, _fx.UnitOfWork, _fx.Mapper, NullLogger<BulkUpdateChassisDriveBaysHandler>.Instance);

    private BulkUpdateChassisFanMountsHandler FanMounts() =>
        new(_chassis, _fx.UnitOfWork, _fx.Mapper, NullLogger<BulkUpdateChassisFanMountsHandler>.Instance);

    private BulkUpdateChassisPcieSlotsHandler PcieSlots() =>
        new(_chassis, _fx.UnitOfWork, _fx.Mapper, NullLogger<BulkUpdateChassisPcieSlotsHandler>.Instance);

    private BulkUpdateChassisRadiatorsHandler Radiators() =>
        new(_chassis, _fx.UnitOfWork, _fx.Mapper, NullLogger<BulkUpdateChassisRadiatorsHandler>.Instance);

    private BulkUpdateChassisMbFormFactorsHandler MbFormFactors() =>
        new(_chassis, _fx.UnitOfWork, NullLogger<BulkUpdateChassisMbFormFactorsHandler>.Instance);

    private BulkUpdateChassisPsuFormFactorsHandler PsuFormFactors() =>
        new(_chassis, _fx.UnitOfWork, NullLogger<BulkUpdateChassisPsuFormFactorsHandler>.Instance);

    private Chassis SeedChassis()
    {
        var chassis = new Chassis(
            "4000D",
            _fx.Manufacturer.Id,
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
        chassis.AddDriveBay(new ChassisDriveBay(chassis.Id, DriveBayFormFactor.Inch35, 2));
        var mount = new ChassisFanMount(chassis.Id, FanMountLocation.Front, false);
        mount.AddOption(new ChassisFanMountOption(mount.Id, FanDiameterMm.Mm120, 3));
        chassis.AddFanMount(mount);
        chassis.AddPcieSlot(new ChassisPcieSlot(chassis.Id, false, 7, PcieOrientation.Horizontal));
        chassis.AddRadiator(new ChassisRadiator(chassis.Id, RadiatorLength.Mm360, RadiatorMountLocation.Top, 1));
        chassis.AddMbFormFactor(new ChassisMbFormFactor(chassis.Id, MbFormFactor.Atx));
        chassis.AddPsuFormFactor(new ChassisPsuFormFactor(chassis.Id, PsuFormFactor.Atx));
        _fx.Context.Chassis.Add(chassis);
        _fx.Context.SaveChanges();
        return chassis;
    }
}
