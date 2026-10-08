using System.Linq.Expressions;
using PcBuilderBackend.Domain.Entities;
using PcBuilderBackend.Domain.Enums;
using PcBuilderBackend.Domain.ValueObjects;

namespace PcBuilderBackend.Domain.Compatibility;

public static class PsuPowerBudgetCompatibility
{
    public const decimal CpuVrmEfficiency = 0.90m;
    public const decimal CpuHeadroom = 1.25m;
    public const decimal GpuHeadroom = 1.30m;
    public const decimal PlatformOverheadWatts = 50m;

    private static readonly Expression<Func<Psu, int, int, bool>> PsuCovers =
        (psu, cpuWatts, gpuWatts) =>
            cpuWatts / CpuVrmEfficiency * CpuHeadroom
            + gpuWatts * GpuHeadroom
            + PlatformOverheadWatts
            <= psu.Wattage;

    private static readonly Func<Psu, int, int, bool> CoversCompiled = PsuCovers.Compile();

    public static PartsCompatibilityResult Evaluate(Psu psu, Cpu cpu, GraphicsCard? gpu) =>
        CoversCompiled(psu, cpu.PowerConsumptionWatts, gpu?.PowerConsumptionWatts ?? 0)
            ? PartsCompatibilityResult.Compatible()
            : PartsCompatibilityResult.Incompatible(CompatibilityReason.ExceedsPowerBudget);

    public static Expression<Func<Psu, bool>> Filter(Cpu cpu, GraphicsCard? gpu) =>
        CompatibilityExpression.Bind(PsuCovers, cpu.PowerConsumptionWatts, gpu?.PowerConsumptionWatts ?? 0);
}

public static class PsuMotherboardCompatibility
{
    private static readonly Expression<Func<Psu, bool>> HasMotherboardCable =
        psu => (psu.Cables.Where(cable => cable.Type == PsuCableType.Motherboard24Pin)
            .Sum(cable => (int?)cable.CablesCount) ?? 0) >= 1;

    private static readonly Expression<Func<Psu, int, bool>> HasCpuCables =
        (psu, epsConnectors) =>
            (psu.Cables.Where(cable => cable.Type == PsuCableType.Cpu4Plus4Pin)
                .Sum(cable => (int?)cable.CablesCount) ?? 0) >= epsConnectors;

    private static readonly Func<Psu, bool> HasMotherboardCableCompiled = HasMotherboardCable.Compile();
    private static readonly Func<Psu, int, bool> HasCpuCablesCompiled = HasCpuCables.Compile();

    public static PartsCompatibilityResult Evaluate(Psu psu, Motherboard motherboard)
    {
        if (!HasMotherboardCableCompiled(psu))
            return PartsCompatibilityResult.Incompatible(CompatibilityReason.MissingMotherboardPowerCable);

        return HasCpuCablesCompiled(psu, motherboard.EpsConnectors)
            ? PartsCompatibilityResult.Compatible()
            : PartsCompatibilityResult.Incompatible(CompatibilityReason.InsufficientCpuPowerCables);
    }

    public static Expression<Func<Psu, bool>> Filter(Motherboard motherboard) =>
        CompatibilityExpression.And(
            HasMotherboardCable,
            CompatibilityExpression.Bind(HasCpuCables, motherboard.EpsConnectors));
}

public static class PsuGraphicsCardCompatibility
{
    private static readonly Expression<Func<Psu, PsuCableType, int, bool>> HasCables =
        (psu, cableType, required) =>
            (psu.Cables.Where(cable => cable.Type == cableType)
                .Sum(cable => (int?)cable.CablesCount) ?? 0) >= required;

    private static readonly Func<Psu, PsuCableType, int, bool> HasCablesCompiled = HasCables.Compile();

    public static PartsCompatibilityResult Evaluate(Psu psu, GraphicsCard gpu)
    {
        var cableType = RequiredCable(gpu);
        return HasCablesCompiled(psu, cableType, gpu.PowerConnectorCount)
            ? PartsCompatibilityResult.Compatible()
            : PartsCompatibilityResult.Incompatible(CompatibilityReason.InsufficientPciePowerCables);
    }

    public static Expression<Func<Psu, bool>> Filter(GraphicsCard gpu) =>
        CompatibilityExpression.Bind(HasCables, RequiredCable(gpu), gpu.PowerConnectorCount);

    private static PsuCableType RequiredCable(GraphicsCard gpu) => gpu.PowerConnectorType switch
    {
        PsuCableType.Pcie6Plus2Pin => PsuCableType.Pcie6Plus2Pin,
        PsuCableType.Pcie12V2X6 => PsuCableType.Pcie12V2X6,
        PsuCableType.Pcie12VHighPower => PsuCableType.Pcie12VHighPower,
        _ => throw new ArgumentOutOfRangeException(
            nameof(gpu),
            gpu.PowerConnectorType,
            $"Unsupported power connector '{gpu.PowerConnectorType}'.")
    };
}

public static class PsuStorageCompatibility
{
    private static readonly Expression<Func<Psu, int, bool>> HasSataCables =
        (psu, sataDriveCount) =>
            (psu.Cables.Where(cable => cable.Type == PsuCableType.Sata)
                .Sum(cable => (int?)cable.CablesCount) ?? 0) >= sataDriveCount;

    private static readonly Func<Psu, int, bool> HasSataCablesCompiled = HasSataCables.Compile();

    public static PartsCompatibilityResult Evaluate(Psu psu, IEnumerable<StorageDrive> drives)
    {
        var sataDriveCount = drives.Count(drive => drive.Interface == StorageInterface.Sata);
        return HasSataCablesCompiled(psu, sataDriveCount)
            ? PartsCompatibilityResult.Compatible()
            : PartsCompatibilityResult.Incompatible(CompatibilityReason.InsufficientSataCables);
    }
}
