using PcBuilderBackend.Domain.Enums;

namespace PcBuilderBackend.Application.Catalog.ChassisFans.Dto;

public class ChassisFanImportRow
{
    public int RowNumber { get; init; }
    public string Name { get; init; } = string.Empty;
    public Guid ManufacturerId { get; init; }
    public FanDiameterMm DiameterMm { get; init; }
    public int FansCountPerPack { get; init; }
    public decimal ThicknessMm { get; init; }
    public FanHeaderType HeaderType { get; init; }
    public bool SupportsDaisyChain { get; init; }
    public int? MaxFansPerDaisyChain { get; init; }
}
