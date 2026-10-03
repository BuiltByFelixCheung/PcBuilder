using PcBuilderBackend.Domain.Enums;
using PcBuilderBackend.Domain.ValueObjects;

namespace PcBuilderBackend.Domain.Entities;

public class CpuCooler : ProductEntity
{
    public CpuCoolerType Type { get; private set; }
    public decimal? CoolerLengthMm { get; private set; }
    public decimal? CoolerWidthMm { get; private set; }
    public decimal? CoolerHeightMm { get; private set; }
    public decimal? MaxRamHeightMm { get; private set; }
    public RadiatorClass? RadiatorClass { get; private set; }
    public decimal? RadiatorLengthMm { get; private set; }
    public decimal? RadiatorWidthMm { get; private set; }
    public decimal? RadiatorHeightMm { get; private set; }
    public decimal? WaterBlockLengthMm { get; private set; }
    public decimal? WaterBlockWidthMm { get; private set; }
    public decimal? WaterBlockHeightMm { get; private set; }
    public decimal? FanThicknessMm { get; private set; }
    public decimal? FanWidthMm { get; private set; }
    public decimal? FanHeightMm { get; private set; }
    public int? FanCount { get; private set; }

    private readonly List<CpuCoolerSocket> _cpuCoolerSockets = [];
    public IReadOnlyCollection<CpuCoolerSocket> CpuCoolerSockets => _cpuCoolerSockets;

    protected CpuCooler()
    {
    }

    public CpuCooler(Guid manufacturerId, string name, CpuCoolerSpecs specs)
    {
        SetName(name);
        SetManufacturer(manufacturerId);
        ApplyTypeSpecs(specs);
    }

    public void UpdateSpecs(CpuCoolerSpecs specs)
    {
        ApplyTypeSpecs(specs);
        UpdatedAtUtc = DateTime.UtcNow;
    }

    public void AddCpuCoolerSocket(CpuCoolerSocket cpuCoolerSocket)
    {
        if (_cpuCoolerSockets.Any(x => x.SocketId == cpuCoolerSocket.SocketId))
            throw new ArgumentException("The cpu cooler socket already exists.");

        _cpuCoolerSockets.Add(cpuCoolerSocket);
    }

    public void RemoveCpuCoolerSocket(CpuCoolerSocket cpuCoolerSocket)
    {
        if (_cpuCoolerSockets.All(x => x.SocketId != cpuCoolerSocket.SocketId))
            throw new ArgumentException("The cpu cooler socket does not exist.");

        _cpuCoolerSockets.Remove(cpuCoolerSocket);
    }

    public PartsCompatibilityResult CheckCompatibility(Cpu cpu)
    {
        return _cpuCoolerSockets.All(x => x.SocketId != cpu.SocketId)
            ? PartsCompatibilityResult.Incompatible(CompatibilityReason.MissingCpuCoolerSocket)
            : PartsCompatibilityResult.Compatible();
    }

    public PartsCompatibilityResult CheckCompatibility(Ram ram)
    {
        if (Type != CpuCoolerType.Air || !CoolerHeightMm.HasValue || !MaxRamHeightMm.HasValue)
            return PartsCompatibilityResult.Compatible();

        return ram.HeightMm > MaxRamHeightMm.Value
            ? PartsCompatibilityResult.Incompatible(CompatibilityReason.RamHeightExceedsCoolerLimit)
            : PartsCompatibilityResult.Compatible();
    }

    private void ApplyTypeSpecs(CpuCoolerSpecs specs)
    {
        var type = specs.Type;
        if (!Enum.IsDefined(type))
            throw new ArgumentException("Invalid cooler type.", nameof(type));

        Type = type;
        if (type == CpuCoolerType.Air)
        {
            ValidateAirCooler(specs);
            SetAirCoolerSpecs(specs);
        }
        else
        {
            var radiatorClass = specs.RadiatorClass;
            if (radiatorClass is null)
                throw new ArgumentException("RadiatorClass is required for liquid coolers.", nameof(radiatorClass));

            SetLiquidCoolerSpecs(specs);
        }

        SetFanSpecs(specs);
    }

    private static void ValidateAirCooler(CpuCoolerSpecs specs)
    {
        var coolerHeightMm = specs.CoolerHeightMm;
        var maxRamHeightMm = specs.MaxRamHeightMm;
        var radiatorClass = specs.RadiatorClass;
        var radiatorLengthMm = specs.RadiatorLengthMm;
        var radiatorWidthMm = specs.RadiatorWidthMm;
        var radiatorHeightMm = specs.RadiatorHeightMm;
        var waterBlockLengthMm = specs.WaterBlockLengthMm;
        var waterBlockWidthMm = specs.WaterBlockWidthMm;
        var waterBlockHeightMm = specs.WaterBlockHeightMm;

        if (coolerHeightMm is null)
            throw new ArgumentException("CoolerHeightMm is required for air coolers.", nameof(coolerHeightMm));
        if (maxRamHeightMm is null)
            throw new ArgumentException("MaxRamHeightMm is required for air coolers.", nameof(maxRamHeightMm));
        if (radiatorClass is not null)
            throw new ArgumentException("RadiatorClass must be empty for air coolers.", nameof(radiatorClass));
        if (radiatorLengthMm is not null || radiatorWidthMm is not null || radiatorHeightMm is not null)
            throw new ArgumentException("Radiator dimensions must be empty for air coolers.", nameof(radiatorLengthMm));
        if (waterBlockLengthMm is not null || waterBlockWidthMm is not null || waterBlockHeightMm is not null)
            throw new ArgumentException("Water block dimensions must be empty for air coolers.", nameof(waterBlockLengthMm));
    }

    private void SetFanSpecs(CpuCoolerSpecs specs)
    {
        var fanThicknessMm = specs.FanThicknessMm;
        var fanWidthMm = specs.FanWidthMm;
        var fanHeightMm = specs.FanHeightMm;
        var fanCount = specs.FanCount;

        RequirePositiveIfPresent(fanThicknessMm, nameof(fanThicknessMm));
        RequirePositiveIfPresent(fanWidthMm, nameof(fanWidthMm));
        RequirePositiveIfPresent(fanHeightMm, nameof(fanHeightMm));
        if (fanCount is <= 0)
            throw new ArgumentException("Fan count must be greater than zero.", nameof(fanCount));

        FanThicknessMm = fanThicknessMm;
        FanWidthMm = fanWidthMm;
        FanHeightMm = fanHeightMm;
        FanCount = fanCount;
    }

    private void SetAirCoolerSpecs(CpuCoolerSpecs specs)
    {
        var coolerHeightMm = specs.CoolerHeightMm!.Value;
        var maxRamHeightMm = specs.MaxRamHeightMm!.Value;
        var coolerLengthMm = specs.CoolerLengthMm;
        var coolerWidthMm = specs.CoolerWidthMm;

        if (coolerHeightMm <= 0)
            throw new ArgumentException("CoolerHeightMm must be greater than zero.", nameof(coolerHeightMm));

        if (maxRamHeightMm <= 0)
            throw new ArgumentException("MaxRamHeightMm must be greater than zero.", nameof(maxRamHeightMm));

        RequirePositiveIfPresent(coolerLengthMm, nameof(coolerLengthMm));
        RequirePositiveIfPresent(coolerWidthMm, nameof(coolerWidthMm));

        CoolerLengthMm = coolerLengthMm;
        CoolerWidthMm = coolerWidthMm;
        CoolerHeightMm = coolerHeightMm;
        MaxRamHeightMm = maxRamHeightMm;
        RadiatorClass = null;
        RadiatorLengthMm = null;
        RadiatorWidthMm = null;
        RadiatorHeightMm = null;
        WaterBlockLengthMm = null;
        WaterBlockWidthMm = null;
        WaterBlockHeightMm = null;
    }

    private void SetLiquidCoolerSpecs(CpuCoolerSpecs specs)
    {
        var radiatorClass = specs.RadiatorClass!.Value;
        var radiatorLengthMm = specs.RadiatorLengthMm;
        var radiatorWidthMm = specs.RadiatorWidthMm;
        var radiatorHeightMm = specs.RadiatorHeightMm;
        var waterBlockLengthMm = specs.WaterBlockLengthMm;
        var waterBlockWidthMm = specs.WaterBlockWidthMm;
        var waterBlockHeightMm = specs.WaterBlockHeightMm;

        if (!Enum.IsDefined(radiatorClass))
            throw new ArgumentException("Invalid radiator class.", nameof(radiatorClass));

        RequirePositiveIfPresent(radiatorLengthMm, nameof(radiatorLengthMm));
        RequirePositiveIfPresent(radiatorWidthMm, nameof(radiatorWidthMm));
        RequirePositiveIfPresent(radiatorHeightMm, nameof(radiatorHeightMm));
        RequirePositiveIfPresent(waterBlockLengthMm, nameof(waterBlockLengthMm));
        RequirePositiveIfPresent(waterBlockWidthMm, nameof(waterBlockWidthMm));
        RequirePositiveIfPresent(waterBlockHeightMm, nameof(waterBlockHeightMm));

        RadiatorClass = radiatorClass;
        RadiatorLengthMm = radiatorLengthMm;
        RadiatorWidthMm = radiatorWidthMm;
        RadiatorHeightMm = radiatorHeightMm;
        WaterBlockLengthMm = waterBlockLengthMm;
        WaterBlockWidthMm = waterBlockWidthMm;
        WaterBlockHeightMm = waterBlockHeightMm;
        CoolerLengthMm = null;
        CoolerWidthMm = null;
        CoolerHeightMm = null;
        MaxRamHeightMm = null;
    }

    private static void RequirePositiveIfPresent(decimal? value, string name)
    {
        if (value is <= 0)
            throw new ArgumentException("Dimension must be greater than zero.", name);
    }
}
