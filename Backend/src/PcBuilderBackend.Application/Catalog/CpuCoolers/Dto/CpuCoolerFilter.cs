using PcBuilderBackend.Application.Common.Dto;
using PcBuilderBackend.Domain.Enums;

namespace PcBuilderBackend.Application.Catalog.CpuCoolers.Dto;

public record CpuCoolerFilter
{
    public string? Name { get; init; } = string.Empty;
    public Guid? ManufacturerId { get; init; }
    public CpuCoolerType? Type { get; init; }
    public RangeFilter? CoolerHeightMm { get; init; }
    public RangeFilter? MaxRamHeightMm { get; init; }
    public RadiatorClass? RadiatorClass { get; init; }
    public Guid? SocketId { get; init; }
    public Guid? CpuId { get; init; }
    public Guid? ChassisId { get; init; }
    public Guid? RamId { get; init; }
    public Guid? MotherboardId { get; init; }
}
