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

    public CpuCooler(
        Guid manufacturerId,
        string name,
        CpuCoolerType type,
        decimal? coolerHeightMm,
        decimal? maxRamHeightMm,
        RadiatorClass? radiatorClass,
        decimal? radiatorLengthMm = null,
        decimal? radiatorWidthMm = null,
        decimal? radiatorHeightMm = null,
        decimal? coolerLengthMm = null,
        decimal? coolerWidthMm = null,
        decimal? waterBlockLengthMm = null,
        decimal? waterBlockWidthMm = null,
        decimal? waterBlockHeightMm = null,
        decimal? fanThicknessMm = null,
        decimal? fanWidthMm = null,
        decimal? fanHeightMm = null,
        int? fanCount = null)
    {
        SetName(name);
        SetManufacturer(manufacturerId);
        ApplyTypeSpecs(
            type,
            coolerHeightMm,
            maxRamHeightMm,
            radiatorClass,
            radiatorLengthMm,
            radiatorWidthMm,
            radiatorHeightMm,
            coolerLengthMm,
            coolerWidthMm,
            waterBlockLengthMm,
            waterBlockWidthMm,
            waterBlockHeightMm,
            fanThicknessMm,
            fanWidthMm,
            fanHeightMm,
            fanCount);
    }

    public void UpdateSpecs(
        CpuCoolerType type,
        decimal? coolerHeightMm,
        decimal? maxRamHeightMm,
        RadiatorClass? radiatorClass,
        decimal? radiatorLengthMm,
        decimal? radiatorWidthMm,
        decimal? radiatorHeightMm,
        decimal? coolerLengthMm,
        decimal? coolerWidthMm,
        decimal? waterBlockLengthMm,
        decimal? waterBlockWidthMm,
        decimal? waterBlockHeightMm,
        decimal? fanThicknessMm,
        decimal? fanWidthMm,
        decimal? fanHeightMm,
        int? fanCount)
    {
        ApplyTypeSpecs(
            type,
            coolerHeightMm,
            maxRamHeightMm,
            radiatorClass,
            radiatorLengthMm,
            radiatorWidthMm,
            radiatorHeightMm,
            coolerLengthMm,
            coolerWidthMm,
            waterBlockLengthMm,
            waterBlockWidthMm,
            waterBlockHeightMm,
            fanThicknessMm,
            fanWidthMm,
            fanHeightMm,
            fanCount);
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

    private void ApplyTypeSpecs(
        CpuCoolerType type,
        decimal? coolerHeightMm,
        decimal? maxRamHeightMm,
        RadiatorClass? radiatorClass,
        decimal? radiatorLengthMm,
        decimal? radiatorWidthMm,
        decimal? radiatorHeightMm,
        decimal? coolerLengthMm,
        decimal? coolerWidthMm,
        decimal? waterBlockLengthMm,
        decimal? waterBlockWidthMm,
        decimal? waterBlockHeightMm,
        decimal? fanThicknessMm,
        decimal? fanWidthMm,
        decimal? fanHeightMm,
        int? fanCount)
    {
        if (!Enum.IsDefined(type))
            throw new ArgumentException("Invalid cooler type.", nameof(type));

        Type = type;
        if (type == CpuCoolerType.Air)
        {
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

            SetAirCoolerSpecs(coolerHeightMm.Value, maxRamHeightMm.Value, coolerLengthMm, coolerWidthMm);
        }
        else
        {
            if (radiatorClass is null)
                throw new ArgumentException("RadiatorClass is required for liquid coolers.", nameof(radiatorClass));

            SetLiquidCoolerSpecs(
                radiatorClass.Value,
                radiatorLengthMm,
                radiatorWidthMm,
                radiatorHeightMm,
                waterBlockLengthMm,
                waterBlockWidthMm,
                waterBlockHeightMm);
        }

        SetFanSpecs(fanThicknessMm, fanWidthMm, fanHeightMm, fanCount);
    }

    private void SetFanSpecs(
        decimal? fanThicknessMm,
        decimal? fanWidthMm,
        decimal? fanHeightMm,
        int? fanCount)
    {
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

    private void SetAirCoolerSpecs(
        decimal coolerHeightMm,
        decimal maxRamHeightMm,
        decimal? coolerLengthMm,
        decimal? coolerWidthMm)
    {
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

    private void SetLiquidCoolerSpecs(
        RadiatorClass radiatorClass,
        decimal? radiatorLengthMm,
        decimal? radiatorWidthMm,
        decimal? radiatorHeightMm,
        decimal? waterBlockLengthMm,
        decimal? waterBlockWidthMm,
        decimal? waterBlockHeightMm)
    {
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
