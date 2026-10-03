using PcBuilderBackend.Domain.Enums;

namespace PcBuilderBackend.Domain.Entities;

public class ChassisDriveBay : BaseEntity
{
    public Guid ChassisId { get; private set; }
    public List<DriveBayFormFactor> DriveBayFormFactors { get; private set; } = [];
    public int BayCount { get; private set; }
    public Chassis Chassis { get; private set; } = null!;

    protected ChassisDriveBay() {}

    public ChassisDriveBay(Guid chassisId, IEnumerable<DriveBayFormFactor> formFactors, int bayCount)
    {
        SetSpecs(chassisId, formFactors, bayCount);
    }

    public void UpdateSpecs(Guid chassisId, IEnumerable<DriveBayFormFactor> formFactors, int bayCount)
    {
        SetSpecs(chassisId, formFactors, bayCount);
        UpdatedAtUtc = DateTime.UtcNow;
    }

    public bool HasSameFormFactors(ChassisDriveBay other)
    {
        ArgumentNullException.ThrowIfNull(other);
        return DriveBayFormFactors.SequenceEqual(other.DriveBayFormFactors);
    }

    public static List<DriveBayFormFactor> NormalizeFormFactors(IEnumerable<DriveBayFormFactor> formFactors)
    {
        ArgumentNullException.ThrowIfNull(formFactors);
        var values = formFactors.ToList();

        if (values.Count == 0)
            throw new ArgumentException("Drive bay must accept at least one size.");

        if (values.Any(value => !Enum.IsDefined(value)))
            throw new ArgumentException("Drive bay form factor is invalid.");

        if (values.Distinct().Count() != values.Count)
            throw new ArgumentException("Drive bay form factors must be unique.");

        values.Sort();
        return values;
    }

    private void SetSpecs(Guid chassisId, IEnumerable<DriveBayFormFactor> formFactors, int bayCount)
    {
        if (chassisId == Guid.Empty)
            throw new ArgumentException("Chassis ID cannot be empty.");

        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(bayCount);

        ChassisId = chassisId;
        DriveBayFormFactors = NormalizeFormFactors(formFactors);
        BayCount = bayCount;
    }
}
