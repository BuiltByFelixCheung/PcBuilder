using PcBuilderBackend.Application.Common.Dto;
using PcBuilderBackend.Domain.Enums;

namespace PcBuilderBackend.Application.Catalog.Motherboards.Dto;

public record MotherboardFilter
{
    public string? Name { get; init; } = string.Empty;
    public Guid? ManufacturerId { get; init; }
    public Guid? SocketId { get; init; }
    public Guid? ChipsetId { get; init; }
    public int? RamSlots { get; init; }
    public int? MaxMemoryGb { get; init; }
    public int? MaxDimmSizeGb { get; init; }
    public int? SataPorts { get; init; }
    public int? PwmFanHeaders { get; init; }
    public int? DcFanHeaders { get; init; }
    public int? EpsConnectors { get; init; }
    public RangeFilter? WidthMm { get; init; }
    public RangeFilter? HeightMm { get; init; }
    public DdrGeneration? DdrGeneration { get; init; }
    public RamFormFactor? RamFormFactor { get; init; }
    public MbFormFactor? FormFactor { get; init; }
    public bool? WifiEnabled { get; init; }
    public bool? BluetoothEnabled { get; init; }
    public Guid? ChassisId { get; init; }
}