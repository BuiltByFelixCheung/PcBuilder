using PcBuilderBackend.Domain.ValueObjects;

namespace PcBuilderBackend.Application.Catalog.CpuCoolers;

internal static class CpuCoolerSpecMapping
{
    public static CpuCoolerSpecs ToSpecs(this ICpuCoolerFields fields) => new()
    {
        Type = fields.Type,
        CoolerLengthMm = fields.CoolerLengthMm,
        CoolerWidthMm = fields.CoolerWidthMm,
        CoolerHeightMm = fields.CoolerHeightMm,
        MaxRamHeightMm = fields.MaxRamHeightMm,
        RadiatorClass = fields.RadiatorClass,
        RadiatorLengthMm = fields.RadiatorLengthMm,
        RadiatorWidthMm = fields.RadiatorWidthMm,
        RadiatorHeightMm = fields.RadiatorHeightMm,
        WaterBlockLengthMm = fields.WaterBlockLengthMm,
        WaterBlockWidthMm = fields.WaterBlockWidthMm,
        WaterBlockHeightMm = fields.WaterBlockHeightMm,
        FanThicknessMm = fields.FanThicknessMm,
        FanWidthMm = fields.FanWidthMm,
        FanHeightMm = fields.FanHeightMm,
        FanCount = fields.FanCount
    };
}
