using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;
using PcBuilderBackend.Application.Catalog.Chassis;
using PcBuilderBackend.Application.Catalog.Chassis.Commands.CreateChassis;
using PcBuilderBackend.Application.Catalog.Chassis.Dto;
using PcBuilderBackend.Application.Catalog.Chassis.Validators;
using PcBuilderBackend.Application.Catalog.ChassisFans.Commands.CreateChassisFan;
using PcBuilderBackend.Application.Catalog.GraphicsCards;
using PcBuilderBackend.Application.Catalog.GraphicsCards.Commands.CreateGraphicsCard;
using PcBuilderBackend.Application.Catalog.GraphicsCards.Validators;
using PcBuilderBackend.Application.Catalog.WiredNetworkAdapters.Commands.CreateWiredNetworkAdapter;
using PcBuilderBackend.Application.Catalog.WiredNetworkAdapters.Validators;
using PcBuilderBackend.Application.UnitTests.Support;
using PcBuilderBackend.Domain.Entities;
using PcBuilderBackend.Domain.Enums;

namespace PcBuilderBackend.Application.UnitTests.Catalog;

public class RemainingCatalogHandlerTests : IDisposable
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
    public async Task Create_graphics_card_requires_gpu_and_positive_specs()
    {
        var validator = new CreateGraphicsCardCommandValidator(_fx.Lookup);
        var command = new CreateGraphicsCardCommand
        {
            Name = "RTX 4070",
            ManufacturerId = _fx.Manufacturer.Id,
            GpuId = _fx.Gpu.Id,
            VideoMemoryGb = 12,
            PcieSlotsUsed = 2,
            PcieGeneration = PcieGeneration.Gen4,
            LengthMm = 240,
            WidthMm = 120,
            HeightMm = 50,
            PowerConsumptionWatts = 200,
            PowerConnectorType = PsuCableType.Pcie6Plus2Pin,
            PowerConnectorCount = 2
        };
        (await validator.ValidateAsync(command)).IsValid.Should().BeTrue();
        (await validator.ValidateAsync(command with { GpuId = Guid.NewGuid() })).IsValid.Should().BeFalse();

        var cards = Substitute.For<IGraphicsCardRepository>();
        cards.When(x => x.Add(Arg.Any<GraphicsCard>()))
            .Do(ci => _fx.Context.GraphicsCards.Add(ci.Arg<GraphicsCard>()));
        var dto = await new CreateGraphicsCardHandler(
            cards, _fx.UnitOfWork, _fx.Mapper, NullLogger<CreateGraphicsCardHandler>.Instance)
            .Handle(command, CancellationToken.None);
        dto.Name.Should().Be("RTX 4070");
        (await _fx.Context.GraphicsCards.CountAsync()).Should().Be(1);
    }

    [Fact]
    public async Task Create_chassis_validates_dimensions_and_persists()
    {
        var validator = new CreateChassisCommandValidator(_fx.Lookup);
        var command = new CreateChassisCommand
        {
            Name = "4000D",
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
            DriveBays = [new ChassisDriveBayDto([DriveBayFormFactor.Inch35], 2)],
            FanMounts =
            [
                new ChassisFanMountDto(
                    FanMountLocation.Front,
                    false,
                    [new ChassisFanMountOptionDto(FanDiameterMm.Mm120, 3)])
            ]
        };
        (await validator.ValidateAsync(command)).IsValid.Should().BeTrue();
        (await validator.ValidateAsync(command with { LengthMm = 0 })).IsValid.Should().BeFalse();

        var chassis = Substitute.For<IChassisRepository>();
        chassis.When(x => x.Add(Arg.Any<Chassis>()))
            .Do(ci => _fx.Context.Chassis.Add(ci.Arg<Chassis>()));
        var dto = await new CreateChassisHandler(
            chassis, _fx.UnitOfWork, _fx.Mapper, NullLogger<CreateChassisHandler>.Instance)
            .Handle(command, CancellationToken.None);
        dto.Name.Should().Be("4000D");
        dto.DriveBays.Should().ContainSingle()
            .Which.Should().BeEquivalentTo(new ChassisDriveBayDto([DriveBayFormFactor.Inch35], 2));
        var mount = dto.FanMounts.Should().ContainSingle().Subject;
        mount.Location.Should().Be(FanMountLocation.Front);
        mount.SingleDiameterOnly.Should().BeFalse();
        mount.Options.Should().ContainSingle()
            .Which.Should().Be(new ChassisFanMountOptionDto(FanDiameterMm.Mm120, 3));
        (await _fx.Context.Chassis.CountAsync()).Should().Be(1);
    }

    [Fact]
    public async Task Create_chassis_fan_and_wired_adapter()
    {
        var fan = await new CreateChassisFanHandler(
                new TestChassisFanRepository(_fx.Context),
                _fx.UnitOfWork,
                _fx.Mapper,
                NullLogger<CreateChassisFanHandler>.Instance)
            .Handle(new CreateChassisFanCommand
            {
                Name = "LL120",
                ManufacturerId = _fx.Manufacturer.Id,
                DiameterMm = FanDiameterMm.Mm120,
                FansCountPerPack = 3
            }, CancellationToken.None);
        fan.FansCountPerPack.Should().Be(3);

        var nicValidator = new CreateWiredNetworkAdapterCommandValidator(_fx.Lookup);
        var nic = new CreateWiredNetworkAdapterCommand
        {
            Name = "I225-V",
            ManufacturerId = _fx.Manufacturer.Id,
            HostInterface = WiredHostInterface.Pcie,
            MaxSpeedMbps = 2500,
            PcieSlotType = PcieSlotType.X1
        };
        (await nicValidator.ValidateAsync(nic)).IsValid.Should().BeTrue();
        (await nicValidator.ValidateAsync(nic with { PcieSlotType = null })).IsValid.Should().BeFalse();
    }
}
