using PcBuilderBackend.Domain.Enums;
using PcBuilderBackend.Domain.ValueObjects;

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

    public ChassisFan(string name, Guid manufacturerId, ChassisFanSpecs specs)
    {
        SetName(name);
        SetManufacturer(manufacturerId);
        SetSpecs(specs);
    }

    public void UpdateSpecs(ChassisFanSpecs specs)
    {
        SetSpecs(specs);
        UpdatedAtUtc = DateTime.UtcNow;
    }

    private void SetSpecs(ChassisFanSpecs specs)
    {
        ArgumentNullException.ThrowIfNull(specs);

        if (!Enum.IsDefined(specs.DiameterMm))
            throw new ArgumentException("Fan Diameter mm is invalid.", nameof(specs));

        if (!Enum.IsDefined(specs.HeaderType))
            throw new ArgumentException("Fan header type is invalid.", nameof(specs));

        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(specs.FansCountPerPack);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(specs.ThicknessMm);

        var maxFansPerDaisyChain = specs.MaxFansPerDaisyChain;
        if (specs.SupportsDaisyChain)
        {
            if (maxFansPerDaisyChain is null)
                throw new ArgumentException(
                    "Max fans per daisy chain is required when daisy chaining is supported.",
                    nameof(ChassisFanSpecs.MaxFansPerDaisyChain));

            ArgumentOutOfRangeException.ThrowIfLessThanOrEqual(maxFansPerDaisyChain.Value, 1);
        }
        else
        {
            maxFansPerDaisyChain = null;
        }

        DiameterMm = specs.DiameterMm;
        FansCountPerPack = specs.FansCountPerPack;
        ThicknessMm = specs.ThicknessMm;
        HeaderType = specs.HeaderType;
        SupportsDaisyChain = specs.SupportsDaisyChain;
        MaxFansPerDaisyChain = maxFansPerDaisyChain;
    }

    /// <summary>
    /// Motherboard headers consumed by one pack of this product.
    /// Daisy-chained packs share headers up to <see cref="MaxFansPerDaisyChain"/>.
    /// </summary>
    public int HeadersRequiredPerPack()
    {
        if (!SupportsDaisyChain)
            return FansCountPerPack;

        var max = MaxFansPerDaisyChain!.Value;
        return (FansCountPerPack + max - 1) / max;
    }
}
