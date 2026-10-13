using PcBuilderBackend.Domain.Enums;

namespace PcBuilderBackend.Domain.Entities;

public class ChassisFan : ProductEntity
{
    public FanDiameterMm DiameterMm { get; private set; }
    public int FansCountPerPack { get; private set; }
    public decimal ThicknessMm { get; private set; }
    public FanHeaderType HeaderType { get; private set; }
    public bool SupportsDaisyChain { get; private set; }
    public int? MaxFansPerDaisyChain { get; private set; }

    protected ChassisFan() {}

    public ChassisFan(
        string name,
        Guid manufacturerId,
        FanDiameterMm diameterMm,
        int fansCountPerPack,
        decimal thicknessMm,
        FanHeaderType headerType,
        bool supportsDaisyChain,
        int? maxFansPerDaisyChain)
    {
        SetName(name);
        SetManufacturer(manufacturerId);
        SetSpecs(
            diameterMm,
            fansCountPerPack,
            thicknessMm,
            headerType,
            supportsDaisyChain,
            maxFansPerDaisyChain);
    }

    public void UpdateSpecs(
        FanDiameterMm diameterMm,
        int fansCountPerPack,
        decimal thicknessMm,
        FanHeaderType headerType,
        bool supportsDaisyChain,
        int? maxFansPerDaisyChain)
    {
        SetSpecs(
            diameterMm,
            fansCountPerPack,
            thicknessMm,
            headerType,
            supportsDaisyChain,
            maxFansPerDaisyChain);
        UpdatedAtUtc = DateTime.UtcNow;
    }

    private void SetSpecs(
        FanDiameterMm diameterMm,
        int fansCountPerPack,
        decimal thicknessMm,
        FanHeaderType headerType,
        bool supportsDaisyChain,
        int? maxFansPerDaisyChain)
    {
        if (!Enum.IsDefined(diameterMm))
            throw new ArgumentException("Fan Diameter mm is invalid");

        if (!Enum.IsDefined(headerType))
            throw new ArgumentException("Fan header type is invalid.", nameof(headerType));

        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(fansCountPerPack);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(thicknessMm);

        if (supportsDaisyChain)
        {
            if (maxFansPerDaisyChain is null)
                throw new ArgumentException(
                    "Max fans per daisy chain is required when daisy chaining is supported.",
                    nameof(maxFansPerDaisyChain));

            ArgumentOutOfRangeException.ThrowIfLessThanOrEqual(maxFansPerDaisyChain.Value, 1);
        }
        else
        {
            maxFansPerDaisyChain = null;
        }

        DiameterMm = diameterMm;
        FansCountPerPack = fansCountPerPack;
        ThicknessMm = thicknessMm;
        HeaderType = headerType;
        SupportsDaisyChain = supportsDaisyChain;
        MaxFansPerDaisyChain = maxFansPerDaisyChain;
    }
}
