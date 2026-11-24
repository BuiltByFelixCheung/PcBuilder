using FluentAssertions;
using PcBuilderBackend.Domain.Compatibility;
using PcBuilderBackend.Domain.Entities;
using PcBuilderBackend.Domain.Enums;
using PcBuilderBackend.Domain.ValueObjects;

namespace PcBuilderBackend.Domain.UnitTests.Catalog;

public class CompatibilityExplanationTests
{
    private static readonly Guid ManufacturerId = Guid.NewGuid();

    [Fact]
    public void Graphics_card_facts_are_empty_exactly_when_the_card_fits()
    {
        var chassis = CreateChassis(maxGraphicsCardLengthMm: 320);
        chassis.AddPcieSlot(new ChassisPcieSlot(chassis.Id, lowProfileSlots: false, slotCount: 2, PcieOrientation.Horizontal));
        var fits = CreateCard(lengthMm: 300, slotsUsed: 2);
        var tooLong = CreateCard(lengthMm: 400, slotsUsed: 2);
        var tooThick = CreateCard(lengthMm: 300, slotsUsed: 3);

        ChassisGraphicsCardCompatibility.Matches(chassis, fits).Should().BeTrue();
        ChassisGraphicsCardCompatibility.Explain(chassis, fits).Should().BeEmpty();

        ChassisGraphicsCardCompatibility.Matches(chassis, tooLong).Should().BeFalse();
        ChassisGraphicsCardCompatibility.Explain(chassis, tooLong).Should().ContainSingle(fact =>
            fact.Aspect == CompatibilityAspect.LengthMm && fact.Limit == "320" && fact.Actual == "400");

        ChassisGraphicsCardCompatibility.Matches(chassis, tooThick).Should().BeFalse();
        ChassisGraphicsCardCompatibility.Explain(chassis, tooThick).Should().ContainSingle(fact =>
            fact.Aspect == CompatibilityAspect.PcieSlotCount && fact.Limit == "2" && fact.Actual == "3");
    }

    [Fact]
    public void Motherboard_memory_facts_name_each_failed_clause_and_stay_empty_when_it_fits()
    {
        var board = CreateMotherboard();
        var fits = CreateRam(DdrGeneration.Ddr5, RamFormFactor.UDimm, modules: 2, perStickGb: 16);
        var wrongGeneration = CreateRam(DdrGeneration.Ddr4, RamFormFactor.UDimm, modules: 2, perStickGb: 16);

        MotherboardMemoryCompatibility.Matches(board, fits).Should().BeTrue();
        MotherboardMemoryCompatibility.Explain(board, fits).Should().BeEmpty();

        MotherboardMemoryCompatibility.Matches(board, wrongGeneration).Should().BeFalse();
        MotherboardMemoryCompatibility.Explain(board, wrongGeneration).Should().ContainSingle(fact =>
            fact.Aspect == CompatibilityAspect.DdrGeneration
            && fact.Limit == nameof(DdrGeneration.Ddr5)
            && fact.Actual == nameof(DdrGeneration.Ddr4));
    }

    [Fact]
    public void Chassis_motherboard_explanation_reports_form_factor_and_size_together()
    {
        var chassis = CreateChassis(maxGraphicsCardLengthMm: 320);
        chassis.AddMbFormFactor(new ChassisMbFormFactor(chassis.Id, MbFormFactor.Matx));
        var board = CreateMotherboard();

        ChassisMotherboardCompatibility.Matches(chassis, board).Should().BeFalse();
        var facts = ChassisMotherboardCompatibility.Explain(chassis, board);
        facts.Should().Contain(fact =>
            fact.Aspect == CompatibilityAspect.MotherboardFormFactor
            && fact.Limit == nameof(MbFormFactor.Matx)
            && fact.Actual == nameof(MbFormFactor.Atx));
        facts.Should().Contain(fact => fact.Aspect == CompatibilityAspect.HeightMm);
    }

    private static Chassis CreateChassis(decimal maxGraphicsCardLengthMm) =>
        new("Case", ManufacturerId, new ChassisSpecs
        {
            LengthMm = 400,
            WidthMm = 210,
            HeightMm = 450,
            MotherboardMaxWidthMm = 245,
            MotherboardMaxHeightMm = 245,
            MaxCpuCoolerHeightMm = 160,
            MaxGraphicsCardLengthMm = maxGraphicsCardLengthMm,
            MaxPsuLengthMm = 180
        });

    private static GraphicsCard CreateCard(decimal lengthMm, int slotsUsed) =>
        new("Card", ManufacturerId, new GraphicsCardSpecs
        {
            GpuId = Guid.NewGuid(),
            VideoMemoryGb = 8,
            PcieSlotsUsed = slotsUsed,
            PcieGeneration = PcieGeneration.Gen4,
            IsLowProfile = false,
            LengthMm = lengthMm,
            WidthMm = 120,
            HeightMm = 40,
            PowerConsumptionWatts = 200,
            PowerConnectorType = PsuCableType.Pcie6Plus2Pin,
            PowerConnectorCount = 1
        });

    private static Motherboard CreateMotherboard() =>
        new(ManufacturerId, "B650", new MotherboardSpecs
        {
            SocketId = Guid.NewGuid(),
            ChipsetId = Guid.NewGuid(),
            RamSlots = 4,
            MaxMemoryGb = 128,
            MaxDimmSizeGb = 32,
            SataPorts = 4,
            PwmFanHeaders = 4,
            DcFanHeaders = 0,
            EpsConnectors = 1,
            WidthMm = 244,
            HeightMm = 305,
            DdrGeneration = DdrGeneration.Ddr5,
            RamFormFactor = RamFormFactor.UDimm,
            MbFormFactor = MbFormFactor.Atx,
            WifiEnabled = false,
            BluetoothEnabled = false
        });

    private static Ram CreateRam(DdrGeneration ddr, RamFormFactor form, int modules, int perStickGb) =>
        new("Kit", ManufacturerId, new RamSpecs
        {
            Color = "Black",
            DdrGeneration = ddr,
            RamFormFactor = form,
            RamRank = RamRank.DualRank,
            MemorySizePerStickGb = perStickGb,
            TotalMemorySizeGb = perStickGb * modules,
            ModulesCount = modules,
            MaxMemorySpeedMts = 6000,
            HeightMm = 40
        });
}
