using PcBuilderBackend.Domain.Enums;
using PcBuilderBackend.Domain.ValueObjects;

namespace PcBuilderBackend.Application.Catalog.Motherboards;

public abstract record MotherboardWriteFields : MotherboardMeasureSpecs, IMotherboardFields
{
    public string Name { get; init; } = string.Empty;
    public Guid ManufacturerId { get; init; }
    public MbFormFactor FormFactor { get; init; }
    public bool WifiEnabled { get; init; }
    public bool BluetoothEnabled { get; init; }
}
