using PcBuilderBackend.Domain.Enums;

namespace PcBuilderBackend.Application.Catalog.CpuCoolers;

public interface ICpuCoolerFields
{
    string Name { get; }
    Guid ManufacturerId { get; }
    CpuCoolerType Type { get; }
    decimal? CoolerLengthMm { get; }
    decimal? CoolerWidthMm { get; }
    decimal? CoolerHeightMm { get; }
    decimal? MaxRamHeightMm { get; }
    RadiatorClass? RadiatorClass { get; }
    decimal? RadiatorLengthMm { get; }
    decimal? RadiatorWidthMm { get; }
    decimal? RadiatorHeightMm { get; }
    decimal? WaterBlockLengthMm { get; }
    decimal? WaterBlockWidthMm { get; }
    decimal? WaterBlockHeightMm { get; }
    decimal? FanThicknessMm { get; }
    decimal? FanWidthMm { get; }
    decimal? FanHeightMm { get; }
    int? FanCount { get; }
}
