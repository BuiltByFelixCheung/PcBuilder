using PcBuilderBackend.Domain.Compatibility;
using PcBuilderBackend.Domain.Enums;
using PcBuilderBackend.Domain.ValueObjects;

namespace PcBuilderBackend.Domain.Entities;

public class Cpu : ProductEntity
{
    public Guid SocketId { get; private set; }
    public int MaxMemoryGb { get; private set; }
    public Guid SeriesId { get; private set; }
    public bool IntegratedGraphics { get; private set; }
    public bool IncludedStockCooler { get; private set; }
    public int ThermalDesignPower { get; private set; }
    public int PowerConsumptionWatts { get; private set; }
    public Socket Socket { get; init; } = null!;
    public CpuSeries Series { get; init; } = null!;
    
    private readonly List<CpuRamCompat> _ramCompats = [];
    public IReadOnlyCollection<CpuRamCompat> RamCompats => _ramCompats;

    private readonly List<CpuSupportChipset> _supportedChipsets = [];
    public IReadOnlyCollection<CpuSupportChipset> SupportedChipsets => _supportedChipsets;
    
    protected Cpu()
    {
    }

    public Cpu(string name, Guid manufacturerId, CpuSpecs specs)
    {
        SetName(name);
        SetManufacturer(manufacturerId);
        SetSpecs(specs);
    }

    public void AddRamCompat(CpuRamCompat ramCompat)
    {
        if (RamCompats.Any(x =>
                x.DdrGeneration == ramCompat.DdrGeneration &&
                x.RamModuleCount == ramCompat.RamModuleCount &&
                x.RamRank == ramCompat.RamRank))
            throw new ArgumentException("CPU RAM compatibility entry already exists.");

        _ramCompats.Add(ramCompat);
    }

    public void RemoveRamCompat(CpuRamCompat ramCompat)
    {
        if (!RamCompats.Any(x =>
                x.DdrGeneration == ramCompat.DdrGeneration &&
                x.RamModuleCount == ramCompat.RamModuleCount &&
                x.RamRank == ramCompat.RamRank))
            throw new ArgumentException("CPU RAM compatibility entry does not exist.");

        _ramCompats.Remove(ramCompat);
    }

    public void AddSupportedChipset(CpuSupportChipset supportChipset)
    {
        if (SupportedChipsets.Any(x => x.ChipsetId == supportChipset.ChipsetId))
            throw new ArgumentException("CPU already has a support entry for this chipset.");

        _supportedChipsets.Add(supportChipset);
    }

    public void RemoveSupportedChipset(CpuSupportChipset supportChipset)
    {
        if (SupportedChipsets.All(x => x.ChipsetId != supportChipset.ChipsetId))
            throw new ArgumentException("CPU does not have a support entry for this chipset.");

        _supportedChipsets.Remove(supportChipset);
    }

    public PartsCompatibilityResult CheckMemoryCompatibility(Ram memory) =>
        CpuMemoryCompatibility.Evaluate(this, memory);


    public void UpdateSpecs(CpuSpecs specs)
    {
        SetSpecs(specs);
        UpdatedAtUtc = DateTime.UtcNow;
    }

    private void SetSpecs(CpuSpecs specs)
    {
        if (specs.SocketId == Guid.Empty)
            throw new ArgumentException("Socket ID is required", nameof(specs));

        if (specs.SeriesId == Guid.Empty)
            throw new ArgumentException("Series ID is required", nameof(specs));

        if (specs.MaxMemoryGb <= 0)
            throw new ArgumentException("Max Memory GB is required", nameof(specs));

        if (specs.ThermalDesignPower <= 0)
            throw new ArgumentException("Thermal Design Power is required", nameof(specs));

        if (specs.PowerConsumptionWatts <= 0)
            throw new ArgumentException("Power Consumption Watts is required", nameof(specs));

        SocketId = specs.SocketId;
        SeriesId = specs.SeriesId;
        MaxMemoryGb = specs.MaxMemoryGb;
        IntegratedGraphics = specs.IntegratedGraphics;
        IncludedStockCooler = specs.IncludedStockCooler;
        ThermalDesignPower = specs.ThermalDesignPower;
        PowerConsumptionWatts = specs.PowerConsumptionWatts;
    }
}
