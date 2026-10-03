using MediatR;
using PcBuilderBackend.Application.Catalog.CpuCoolers.Dto;
using PcBuilderBackend.Domain.Enums;
using PcBuilderBackend.Application.Catalog.CpuCoolers;

namespace PcBuilderBackend.Application.Catalog.CpuCoolers.Commands.CreateCpuCooler;

public record CreateCpuCoolerCommand : IRequest<CpuCoolerDto>, ICpuCoolerFields
{
    public string Name { get; init; } = string.Empty;
    public Guid ManufacturerId { get; init; }
    public CpuCoolerType Type { get; init; }
    public decimal? CoolerLengthMm { get; init; }
    public decimal? CoolerWidthMm { get; init; }
    public decimal? CoolerHeightMm { get; init; }
    public decimal? MaxRamHeightMm { get; init; }
    public RadiatorClass? RadiatorClass { get; init; }
    public decimal? RadiatorLengthMm { get; init; }
    public decimal? RadiatorWidthMm { get; init; }
    public decimal? RadiatorHeightMm { get; init; }
    public decimal? WaterBlockLengthMm { get; init; }
    public decimal? WaterBlockWidthMm { get; init; }
    public decimal? WaterBlockHeightMm { get; init; }
    public decimal? FanThicknessMm { get; init; }
    public decimal? FanWidthMm { get; init; }
    public decimal? FanHeightMm { get; init; }
    public int? FanCount { get; init; }
    public List<CpuCoolerSocketDto> Sockets { get; init; } = [];
}
