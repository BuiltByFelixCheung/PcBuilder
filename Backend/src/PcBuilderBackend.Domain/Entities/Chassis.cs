using PcBuilderBackend.Domain.Compatibility;
using PcBuilderBackend.Domain.Enums;
using PcBuilderBackend.Domain.ValueObjects;

namespace PcBuilderBackend.Domain.Entities;

public class Chassis : ProductEntity
{
    public decimal LengthMm { get; private set; }
    public decimal WidthMm { get; private set; }
    public decimal HeightMm { get; private set; }
    public decimal MotherboardMaxWidthMm { get; private set; }
    public decimal MotherboardMaxHeightMm { get; private set; }
    public decimal MaxCpuCoolerHeightMm { get; private set; }
    public decimal MaxGraphicsCardLengthMm { get; private set; }
    public decimal MaxPsuLengthMm { get; private set; }

    private readonly List<ChassisFanMount> _fanMounts = [];
    public IReadOnlyCollection<ChassisFanMount> FanMounts => _fanMounts;

    private readonly List<ChassisDriveBay> _driveBays = [];
    public IReadOnlyCollection<ChassisDriveBay> DriveBays => _driveBays;

    private readonly List<ChassisPcieSlot> _pcieSlots = [];
    public IReadOnlyCollection<ChassisPcieSlot> PcieSlots => _pcieSlots;

    private readonly List<ChassisRadiator> _radiators = [];
    public IReadOnlyCollection<ChassisRadiator> Radiators => _radiators;

    private readonly List<ChassisPsuFormFactor> _psuFormFactors = [];
    public IReadOnlyCollection<ChassisPsuFormFactor> PsuFormFactors => _psuFormFactors;

    private readonly List<ChassisMbFormFactor> _mbFormFactors = [];
    public IReadOnlyCollection<ChassisMbFormFactor> MbFormFactors => _mbFormFactors;

    protected Chassis()
    {
    }

    public Chassis(string name, Guid manufacturerId, ChassisSpecs specs)
    {
        SetName(name);
        SetManufacturer(manufacturerId);
        SetSpecs(specs);
    }

    public void UpdateSpecs(ChassisSpecs specs)
    {
        SetSpecs(specs);
        UpdatedAtUtc = DateTime.UtcNow;
    }

    public void AddDriveBay(ChassisDriveBay driveBay)
    {
        if (_driveBays.Any(x => x.HasSameFormFactors(driveBay)))
            throw new ArgumentException("Chassis Drive Bay already exists.");

        _driveBays.Add(driveBay);
    }

    public void RemoveDriveBay(ChassisDriveBay driveBay)
    {
        if (_driveBays.All(x => !x.HasSameFormFactors(driveBay)))
            throw new ArgumentException("Chassis Drive Bay does not exist.");

        _driveBays.Remove(driveBay);
    }

    public void AddFanMount(ChassisFanMount fanMount)
    {
        if (_fanMounts.Any(x => x.Location == fanMount.Location))
            throw new ArgumentException("Chassis Fan Mount already exists.");

        _fanMounts.Add(fanMount);
    }

    public void RemoveFanMount(ChassisFanMount fanMount)
    {
        if (_fanMounts.All(x => x.Location != fanMount.Location))
            throw new ArgumentException("Chassis Fan Mount does not exist.");

        _fanMounts.Remove(fanMount);
    }

    public void AddMbFormFactor(ChassisMbFormFactor mbFormFactor)
    {
        if (_mbFormFactors.Any(x => x.MbFormFactor == mbFormFactor.MbFormFactor))
            throw new ArgumentException("Chassis Motherboard Form Factor already exists.");

        _mbFormFactors.Add(mbFormFactor);
    }

    public void RemoveMbFormFactor(ChassisMbFormFactor mbFormFactor)
    {
        if (_mbFormFactors.All(x => x.MbFormFactor != mbFormFactor.MbFormFactor))
            throw new ArgumentException("Chassis Motherboard Form Factor does not exist.");

        _mbFormFactors.Remove(mbFormFactor);
    }

    public void AddPcieSlot(ChassisPcieSlot pcieSlot)
    {
        if (_pcieSlots.Any(x => x.LowProfileSlots == pcieSlot.LowProfileSlots && x.Orientation == pcieSlot.Orientation))
            throw new ArgumentException("Chassis PcieSlot already exists.");

        _pcieSlots.Add(pcieSlot);
    }

    public void RemovePcieSlot(ChassisPcieSlot pcieSlot)
    {
        if (_pcieSlots.All(x => x.LowProfileSlots != pcieSlot.LowProfileSlots || x.Orientation != pcieSlot.Orientation))
            throw new ArgumentException("Chassis PcieSlot does not exist.");

        _pcieSlots.Remove(pcieSlot);
    }

    public void AddPsuFormFactor(ChassisPsuFormFactor psuFormFactor)
    {
        if (_psuFormFactors.Any(x => x.PsuFormFactor == psuFormFactor.PsuFormFactor))
            throw new ArgumentException("Chassis Psu Form Factor already exists.");

        _psuFormFactors.Add(psuFormFactor);
    }

    public void RemovePsuFormFactor(ChassisPsuFormFactor psuFormFactor)
    {
        if (_psuFormFactors.All(x => x.PsuFormFactor != psuFormFactor.PsuFormFactor))
            throw new ArgumentException("Chassis Psu Form Factor does not exist.");

        _psuFormFactors.Remove(psuFormFactor);
    }

    public void AddRadiator(ChassisRadiator radiator)
    {
        if (_radiators.Any(x => x.Length == radiator.Length && x.MountLocation == radiator.MountLocation))
            throw new ArgumentException("Chassis Radiator already exists.");

        _radiators.Add(radiator);
    }

    public void RemoveRadiator(ChassisRadiator radiator)
    {
        if (_radiators.All(x => x.Length != radiator.Length || x.MountLocation != radiator.MountLocation))
            throw new ArgumentException("Chassis Radiator does not exist.");

        _radiators.Remove(radiator);
    }

    public bool CheckGraphicsCardCompatibility(GraphicsCard graphicsCard) =>
        ChassisGraphicsCardCompatibility.Matches(this, graphicsCard);

    public bool CheckMotherboardCompatibility(Motherboard motherboard) =>
        ChassisMotherboardCompatibility.Matches(this, motherboard);

    public bool CheckPsuCompatibility(Psu psu) =>
        ChassisPsuCompatibility.Matches(this, psu);

    public bool CheckCpuCoolerCompatibility(CpuCooler cpuCooler)
    {
        if (cpuCooler.Type is not (CpuCoolerType.Air or CpuCoolerType.Water))
            throw new ArgumentOutOfRangeException(
                nameof(cpuCooler),
                cpuCooler.Type,
                $"Unsupported cooler type '{cpuCooler.Type}'.");

        return ChassisCpuCoolerCompatibility.Matches(this, cpuCooler);
    }

    /// <param name="fans">
    /// Selected packs (one entry per pack unit; expand quantity by repeating the product).
    /// Packs may mix diameters and products; capacity is evaluated in aggregate.
    /// Each mount location contributes at most one diameter option (e.g. 3x120 or 2x140, not both).
    /// </param>
    public bool CheckFanCompatibility(IEnumerable<ChassisFan> fans)
    {
        ArgumentNullException.ThrowIfNull(fans);

        var remaining = fans
            .GroupBy(fan => fan.DiameterMm)
            .ToDictionary(group => group.Key, group => group.Sum(fan => fan.FansCountPerPack));

        if (remaining.Count == 0)
            return true;

        return CanAssignFanMounts([.. FanMounts], 0, remaining);
    }

    public bool CheckFanCompatibility(ChassisFan fan)
    {
        ArgumentNullException.ThrowIfNull(fan);
        return CheckFanCompatibility([fan]);
    }

    /// <param name="drives">
    /// Selected drives (one entry per unit; expand quantity by repeating the product).
    /// M.2 drives are ignored (motherboard-mounted). 2.5" and 3.5" drives share a bay that lists both sizes.
    /// </param>
    public bool CheckStorageDriveCompatibility(IEnumerable<StorageDrive> drives)
    {
        ArgumentNullException.ThrowIfNull(drives);
        return ChassisStorageCompatibility.Matches(this, drives);
    }

    public bool CheckStorageDriveCompatibility(StorageDrive drive)
    {
        ArgumentNullException.ThrowIfNull(drive);
        return CheckStorageDriveCompatibility([drive]);
    }

    private static bool CanAssignFanMounts(
        IReadOnlyList<ChassisFanMount> mounts,
        int mountIndex,
        Dictionary<FanDiameterMm, int> remaining)
    {
        if (remaining.Values.All(needed => needed <= 0))
            return true;

        if (mountIndex >= mounts.Count)
            return false;

        // Leave this mount unused.
        if (CanAssignFanMounts(mounts, mountIndex + 1, remaining))
            return true;

        foreach (var option in mounts[mountIndex].Options)
        {
            if (!remaining.TryGetValue(option.Diameter, out var needed) || needed <= 0)
                continue;

            var nextRemaining = new Dictionary<FanDiameterMm, int>(remaining)
            {
                [option.Diameter] = Math.Max(0, needed - option.SlotCount)
            };

            if (CanAssignFanMounts(mounts, mountIndex + 1, nextRemaining))
                return true;
        }

        return false;
    }

    private void SetSpecs(ChassisSpecs specs)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(specs.LengthMm);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(specs.WidthMm);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(specs.HeightMm);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(specs.MotherboardMaxWidthMm);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(specs.MotherboardMaxHeightMm);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(specs.MaxCpuCoolerHeightMm);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(specs.MaxGraphicsCardLengthMm);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(specs.MaxPsuLengthMm);

        LengthMm = specs.LengthMm;
        WidthMm = specs.WidthMm;
        HeightMm = specs.HeightMm;
        MotherboardMaxWidthMm = specs.MotherboardMaxWidthMm;
        MotherboardMaxHeightMm = specs.MotherboardMaxHeightMm;
        MaxCpuCoolerHeightMm = specs.MaxCpuCoolerHeightMm;
        MaxGraphicsCardLengthMm = specs.MaxGraphicsCardLengthMm;
        MaxPsuLengthMm = specs.MaxPsuLengthMm;
    }
}
