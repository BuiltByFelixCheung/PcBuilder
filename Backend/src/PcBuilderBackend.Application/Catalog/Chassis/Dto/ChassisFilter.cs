using PcBuilderBackend.Application.Common.Dto;
using PcBuilderBackend.Domain.Enums;

namespace PcBuilderBackend.Application.Catalog.Chassis.Dto;

public record ChassisFilter
{
    public string? Name { get; init; }
    public Guid? ManufacturerId { get; init; }
    public RangeFilter? LengthMm { get; init; }
    public RangeFilter? WidthMm { get; init; }
    public RangeFilter? HeightMm { get; init; }
    public RangeFilter? MotherboardMaxWidthMm { get; init; }
    public RangeFilter? MotherboardMaxHeightMm { get; init; }
    public RangeFilter? MaxCpuCoolerHeightMm { get; init; }
    public RangeFilter? MaxGraphicsCardLengthMm { get; init; }
    public RangeFilter? MaxPsuLengthMm { get; init; }
    public MbFormFactor? MaxSupportedMbFormFactor { get; init; }
}