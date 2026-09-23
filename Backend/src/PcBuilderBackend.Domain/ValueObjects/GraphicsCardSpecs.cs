using PcBuilderBackend.Domain.Enums;

namespace PcBuilderBackend.Domain.ValueObjects;

public record GraphicsCardSpecs
{
    public Guid GpuId { get; init; }
    public int VideoMemoryGb { get; init; }
    public int PcieSlotsUsed { get; init; }
    public PcieGeneration PcieGeneration { get; init; }
    public bool IsLowProfile { get; init; }
    public decimal LengthMm { get; init; }
    public decimal WidthMm { get; init; }
    public decimal HeightMm { get; init; }
    public int PowerConsumptionWatts { get; init; }
    public PsuCableType PowerConnectorType { get; init; }
    public int PowerConnectorCount { get; init; }
}
