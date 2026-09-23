using PcBuilderBackend.Domain.Enums;

namespace PcBuilderBackend.Domain.ValueObjects;

public record MotherboardMeasureSpecs
{
    public Guid SocketId { get; init; }
    public Guid ChipsetId { get; init; }
    public int RamSlots { get; init; }
    public int MaxMemoryGb { get; init; }
    public int MaxDimmSizeGb { get; init; }
    public int SataPorts { get; init; }
    public int FanConnectors { get; init; }
    public int EpsConnectors { get; init; }
    public decimal WidthMm { get; init; }
    public decimal HeightMm { get; init; }
    public DdrGeneration DdrGeneration { get; init; }
    public RamFormFactor RamFormFactor { get; init; }
}

public sealed record MotherboardSpecs : MotherboardMeasureSpecs
{
    public MbFormFactor MbFormFactor { get; init; }
    public bool WifiEnabled { get; init; }
    public bool BluetoothEnabled { get; init; }
}
