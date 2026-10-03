using PcBuilderBackend.Domain.Enums;

namespace PcBuilderBackend.Domain.Entities;

public class ChassisRadiator : BaseEntity
{
    public Guid ChassisId { get; private set; }
    public RadiatorClass Length { get; private set; }
    public RadiatorMountLocation MountLocation { get; private set; }
    public int RadiatorCount { get; private set; }
    public Chassis Chassis { get; private set; } = null!;
    
    protected ChassisRadiator() {}

    public ChassisRadiator(
        Guid chassisId,
        RadiatorClass length,
        RadiatorMountLocation mountLocation,
        int radiatorCount)
    {
        SetSpecs(chassisId, length, mountLocation, radiatorCount);
    }

    public void UpdateSpecs(
        Guid chassisId,
        RadiatorClass length,
        RadiatorMountLocation mountLocation,
        int radiatorCount)
    {
        SetSpecs(chassisId, length, mountLocation, radiatorCount);
        UpdatedAtUtc = DateTime.UtcNow;
    }

    private void SetSpecs(
        Guid chassisId,
        RadiatorClass length,
        RadiatorMountLocation mountLocation,
        int radiatorCount)
    {
        if (chassisId == Guid.Empty)
            throw new ArgumentException("Chassis ID is required.");

        if (!Enum.IsDefined(length))
            throw new ArgumentException("Radiator length is invalid.");

        if (!Enum.IsDefined(mountLocation))
            throw new ArgumentException("Radiator mount location is invalid.");

        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(radiatorCount);

        ChassisId = chassisId;
        Length = length;
        MountLocation = mountLocation;
        RadiatorCount = radiatorCount;
    }
}
