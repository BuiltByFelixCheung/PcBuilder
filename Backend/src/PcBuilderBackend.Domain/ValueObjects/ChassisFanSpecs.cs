using PcBuilderBackend.Domain.Enums;

namespace PcBuilderBackend.Domain.ValueObjects;

public sealed class ChassisFanSpecs
{
    public FanDiameterMm DiameterMm { get; init; }
    public int FansCountPerPack { get; init; }
    public decimal ThicknessMm { get; init; }
    public FanHeaderType HeaderType { get; init; }
    public bool SupportsDaisyChain { get; init; }
    public int? MaxFansPerDaisyChain { get; init; }
}
