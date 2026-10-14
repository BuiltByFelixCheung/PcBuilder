using MediatR;
using PcBuilderBackend.Application.Catalog.ChassisFans.Dto;
using PcBuilderBackend.Domain.Enums;

namespace PcBuilderBackend.Application.Catalog.ChassisFans.Commands.BulkCreateChassisFans;

public record BulkCreateChassisFansCommand(List<CreateChassisFanItem> Fans)
    : IRequest<List<ChassisFanDto>>;

public record CreateChassisFanItem : IChassisFanFields
{
    public string Name { get; init; } = string.Empty;
    public Guid ManufacturerId { get; init; }
    public FanDiameterMm DiameterMm { get; init; }
    public int FansCountPerPack { get; init; }
    public decimal ThicknessMm { get; init; }
    public FanHeaderType HeaderType { get; init; }
    public bool SupportsDaisyChain { get; init; }
    public int? MaxFansPerDaisyChain { get; init; }
}
