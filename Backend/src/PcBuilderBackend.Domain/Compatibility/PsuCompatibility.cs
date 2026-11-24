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

    public static PartsCompatibilityResult Evaluate(Psu psu, Cpu cpu, GraphicsCard? gpu)
    {
        var gpuWatts = gpu?.PowerConsumptionWatts ?? 0;
        if (CoversCompiled(psu, cpu.PowerConsumptionWatts, gpuWatts))
            return PartsCompatibilityResult.Compatible();

        var demand = cpu.PowerConsumptionWatts / CpuVrmEfficiency * CpuHeadroom
            + gpuWatts * GpuHeadroom
            + PlatformOverheadWatts;
        return PartsCompatibilityResult.Incompatible(
            CompatibilityReason.ExceedsPowerBudget,
            [
                new CompatibilityFact(
                    CompatibilityAspect.PowerBudgetWatts,
                    CompatibilityFact.Number(psu.Wattage),
                    CompatibilityFact.Watts(demand))
            ]);
    }

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
        {
            return PartsCompatibilityResult.Incompatible(
                CompatibilityReason.MissingMotherboardPowerCable,
                [
                    new CompatibilityFact(
                        CompatibilityAspect.MotherboardCable,
                        CompatibilityFact.Number(CableCount(psu, PsuCableType.Motherboard24Pin)),
                        "1")
                ]);
        }

        var cpuCables = CableCount(psu, PsuCableType.Cpu4Plus4Pin);
        return HasCpuCablesCompiled(psu, motherboard.EpsConnectors)
            ? PartsCompatibilityResult.Compatible()
            : PartsCompatibilityResult.Incompatible(
                CompatibilityReason.InsufficientCpuPowerCables,
                [
                    new CompatibilityFact(
                        CompatibilityAspect.CpuPowerCable,
                        CompatibilityFact.Number(cpuCables),
                        CompatibilityFact.Number(motherboard.EpsConnectors))
                ]);
    }

    public static Expression<Func<Psu, bool>> Filter(Motherboard motherboard) =>
        CompatibilityExpression.And(
            HasMotherboardCable,
            CompatibilityExpression.Bind(HasCpuCables, motherboard.EpsConnectors));

    private static int CableCount(Psu psu, params PsuCableType[] types) =>
        psu.Cables.Where(cable => types.Contains(cable.Type)).Sum(cable => cable.CablesCount);
}

public static class PsuGraphicsCardCompatibility
{
    private static readonly Expression<Func<Psu, PsuCableType, int, bool>> HasCables =
        (psu, cableType, required) =>
            (psu.Cables.Where(cable => cable.Type == cableType)
                .Sum(cable => (int?)cable.CablesCount) ?? 0) >= required;

    private static readonly Expression<Func<Psu, int, bool>> HasSixPinCables =
        (psu, required) =>
            (psu.Cables.Where(cable =>
                    cable.Type == PsuCableType.Pcie6Pin || cable.Type == PsuCableType.Pcie6Plus2Pin)
                .Sum(cable => (int?)cable.CablesCount) ?? 0) >= required;

    private static readonly Func<Psu, PsuCableType, int, bool> HasCablesCompiled = HasCables.Compile();
    private static readonly Func<Psu, int, bool> HasSixPinCablesCompiled = HasSixPinCables.Compile();

    public static PartsCompatibilityResult Evaluate(Psu psu, GraphicsCard gpu)
    {
        if (RequiresNoExternalPower(gpu))
            return PartsCompatibilityResult.Compatible();

        var cable = gpu.PowerConnectorType == PsuCableType.Pcie6Pin
            ? PsuCableType.Pcie6Pin
            : RequiredCable(gpu);
        var available = gpu.PowerConnectorType == PsuCableType.Pcie6Pin
            ? CableCount(psu, PsuCableType.Pcie6Pin, PsuCableType.Pcie6Plus2Pin)
            : CableCount(psu, cable);
        var compatible = gpu.PowerConnectorType == PsuCableType.Pcie6Pin
            ? HasSixPinCablesCompiled(psu, gpu.PowerConnectorCount)
            : HasCablesCompiled(psu, cable, gpu.PowerConnectorCount);

        return compatible
            ? PartsCompatibilityResult.Compatible()
            : PartsCompatibilityResult.Incompatible(
                CompatibilityReason.InsufficientPciePowerCables,
                [
                    new CompatibilityFact(
                        CompatibilityAspect.PciePowerCable,
                        $"{cable}|{available}",
                        $"{cable}|{gpu.PowerConnectorCount}")
                ]);
    }

    public static Expression<Func<Psu, bool>> Filter(GraphicsCard gpu)
    {
        if (RequiresNoExternalPower(gpu))
            return psu => true;

        return gpu.PowerConnectorType == PsuCableType.Pcie6Pin
            ? CompatibilityExpression.Bind(HasSixPinCables, gpu.PowerConnectorCount)
            : CompatibilityExpression.Bind(HasCables, RequiredCable(gpu), gpu.PowerConnectorCount);
    }

    private static int CableCount(Psu psu, params PsuCableType[] types) =>
        psu.Cables.Where(cable => types.Contains(cable.Type)).Sum(cable => cable.CablesCount);

    private static bool RequiresNoExternalPower(GraphicsCard gpu) =>
        gpu.PowerConnectorType == PsuCableType.None || gpu.PowerConnectorCount == 0;

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

    private static int CableCount(Psu psu, params PsuCableType[] types) =>
        psu.Cables.Where(cable => types.Contains(cable.Type)).Sum(cable => cable.CablesCount);

    public static PartsCompatibilityResult Evaluate(Psu psu, IEnumerable<StorageDrive> drives)
    {
        var sataDriveCount = drives.Count(drive => drive.Interface == StorageInterface.Sata);
        return HasSataCablesCompiled(psu, sataDriveCount)
            ? PartsCompatibilityResult.Compatible()
            : PartsCompatibilityResult.Incompatible(
                CompatibilityReason.InsufficientSataCables,
                [
                    new CompatibilityFact(
                        CompatibilityAspect.SataCable,
                        CompatibilityFact.Number(CableCount(psu, PsuCableType.Sata)),
                        CompatibilityFact.Number(sataDriveCount))
                ]);
    }
}
