using PcBuilderBackend.Domain.Enums;

namespace PcBuilderBackend.Domain.ValueObjects;

public record RamSpecs
{
    public string Color { get; init; } = string.Empty;
    public DdrGeneration DdrGeneration { get; init; }
    public RamFormFactor RamFormFactor { get; init; }
    public RamRank RamRank { get; init; }
    public int MemorySizePerStickGb { get; init; }
    public int TotalMemorySizeGb { get; init; }
    public int ModulesCount { get; init; }
    public int MaxMemorySpeedMts { get; init; }
    public decimal HeightMm { get; init; }
}
