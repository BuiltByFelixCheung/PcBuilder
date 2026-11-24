using FluentAssertions;
using PcBuilderBackend.Domain.Entities;
using PcBuilderBackend.Domain.Enums;
using PcBuilderBackend.Domain.ValueObjects;

namespace PcBuilderBackend.Domain.UnitTests.Catalog;

public class CpuTests
{
    private static readonly Guid ManufacturerId = Guid.NewGuid();
    private static readonly Guid SocketId = Guid.NewGuid();
    private static readonly Guid SeriesId = Guid.NewGuid();

    [Fact]
    public void Constructor_sets_specs()
    {
        var cpu = Create();

        cpu.Name.Should().Be("7800X3D");
        cpu.SocketId.Should().Be(SocketId);
        cpu.MaxMemoryGb.Should().Be(128);
        cpu.PowerConsumptionWatts.Should().Be(120);
    }

    [Fact]
    public void Constructor_rejects_empty_socket_series_and_non_positive_limits()
    {
        var emptySocket = () => new Cpu("x", ManufacturerId, new CpuSpecs
        {
            SocketId = Guid.Empty,
            SeriesId = SeriesId,
            MaxMemoryGb = 128,
            IntegratedGraphics = false,
            IncludedStockCooler = false,
            ThermalDesignPower = 120,
            PowerConsumptionWatts = 120
        });
        var emptySeries = () => new Cpu("x", ManufacturerId, new CpuSpecs
        {
            SocketId = SocketId,
            SeriesId = Guid.Empty,
            MaxMemoryGb = 128,
            IntegratedGraphics = false,
            IncludedStockCooler = false,
            ThermalDesignPower = 120,
            PowerConsumptionWatts = 120
        });
        var badMemory = () => new Cpu("x", ManufacturerId, new CpuSpecs
        {
            SocketId = SocketId,
            SeriesId = SeriesId,
            MaxMemoryGb = 0,
            IntegratedGraphics = false,
            IncludedStockCooler = false,
            ThermalDesignPower = 120,
            PowerConsumptionWatts = 120
        });
        var badTdp = () => new Cpu("x", ManufacturerId, new CpuSpecs
        {
            SocketId = SocketId,
            SeriesId = SeriesId,
            MaxMemoryGb = 128,
            IntegratedGraphics = false,
            IncludedStockCooler = false,
            ThermalDesignPower = 0,
            PowerConsumptionWatts = 120
        });

        emptySocket.Should().Throw<ArgumentException>().WithParameterName("specs");
        emptySeries.Should().Throw<ArgumentException>().WithParameterName("specs");
        badMemory.Should().Throw<ArgumentException>().WithParameterName("specs");
        badTdp.Should().Throw<ArgumentException>().WithParameterName("specs");
    }

    [Fact]
    public void Ram_compat_add_and_remove_guard_duplicates()
    {
        var cpu = Create();
        var compat = new CpuRamCompat(cpu.Id, DdrGeneration.Ddr5, 2, RamRank.DualRank, 6000);
        cpu.AddRamCompat(compat);

        var duplicate = () => cpu.AddRamCompat(new CpuRamCompat(cpu.Id, DdrGeneration.Ddr5, 2, RamRank.DualRank, 5600));
        duplicate.Should().Throw<ArgumentException>().WithMessage("*already exists*");

        cpu.RemoveRamCompat(compat);
        cpu.RamCompats.Should().BeEmpty();

        var missing = () => cpu.RemoveRamCompat(compat);
        missing.Should().Throw<ArgumentException>().WithMessage("*does not exist*");
    }

    [Fact]
    public void Supported_chipset_add_and_remove_guard_duplicates()
    {
        var cpu = Create();
        var chipsetId = Guid.NewGuid();
        var support = new CpuSupportChipset(cpu.Id, chipsetId);
        cpu.AddSupportedChipset(support);

        var duplicate = () => cpu.AddSupportedChipset(new CpuSupportChipset(cpu.Id, chipsetId));
        duplicate.Should().Throw<ArgumentException>();

        cpu.RemoveSupportedChipset(support);
        cpu.SupportedChipsets.Should().BeEmpty();
    }

    [Fact]
    public void Memory_compatibility_matches_config_and_speed()
    {
        var cpu = Create();
        cpu.AddRamCompat(new CpuRamCompat(cpu.Id, DdrGeneration.Ddr5, 2, RamRank.DualRank, 6000));

        var matching = CreateRam(DdrGeneration.Ddr5, 2, RamRank.DualRank, 5600);
        var tooFast = CreateRam(DdrGeneration.Ddr5, 2, RamRank.DualRank, 7200);
        var wrongGen = CreateRam(DdrGeneration.Ddr4, 2, RamRank.DualRank, 3200);

        cpu.CheckMemoryCompatibility(matching).Status.Should().Be(PartsCompatibility.Compatible);
        cpu.CheckMemoryCompatibility(matching).Facts.Should().BeEmpty();

        var reduced = cpu.CheckMemoryCompatibility(tooFast);
        reduced.Status.Should().Be(PartsCompatibility.CompatibleReduced);
        reduced.Reason.Should().Be(CompatibilityReason.MemorySpeedExceedsCpuSupport);
        reduced.Facts.Should().ContainSingle(fact =>
            fact.Aspect == CompatibilityAspect.MemorySpeedMts
            && fact.Limit == "6000"
            && fact.Actual == "7200");

        var mismatch = cpu.CheckMemoryCompatibility(wrongGen);
        mismatch.Status.Should().Be(PartsCompatibility.Incompatible);
        mismatch.Reason.Should().Be(CompatibilityReason.NoMatchingRamConfig);
        mismatch.Facts.Should().Contain(fact =>
            fact.Aspect == CompatibilityAspect.DdrGeneration
            && fact.Limit == null
            && fact.Actual == nameof(DdrGeneration.Ddr4));
        mismatch.Facts.Should().Contain(fact =>
            fact.Aspect == CompatibilityAspect.ModuleCount && fact.Actual == "2");
        mismatch.Facts.Should().Contain(fact =>
            fact.Aspect == CompatibilityAspect.RamRank && fact.Actual == nameof(RamRank.DualRank));
    }

    private static Cpu Create() =>
        new("7800X3D", ManufacturerId, new CpuSpecs
        {
            SocketId = SocketId,
            SeriesId = SeriesId,
            MaxMemoryGb = 128,
            IntegratedGraphics = false,
            IncludedStockCooler = false,
            ThermalDesignPower = 120,
            PowerConsumptionWatts = 120
        });

    private static Ram CreateRam(DdrGeneration ddr, int modules, RamRank rank, int speed) =>
        new("Kit", ManufacturerId, new RamSpecs
        {
            Color = "Black",
            DdrGeneration = ddr,
            RamFormFactor = RamFormFactor.UDimm,
            RamRank = rank,
            MemorySizePerStickGb = 16,
            TotalMemorySizeGb = 16 * modules,
            ModulesCount = modules,
            MaxMemorySpeedMts = speed,
            HeightMm = 40
        });
}
