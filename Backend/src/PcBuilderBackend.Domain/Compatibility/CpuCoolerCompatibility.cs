using System.Linq.Expressions;
using PcBuilderBackend.Domain.Entities;
using PcBuilderBackend.Domain.Enums;
using PcBuilderBackend.Domain.ValueObjects;

namespace PcBuilderBackend.Domain.Compatibility;

public static class CpuCoolerCpuCompatibility
{
    private static readonly Expression<Func<CpuCooler, Guid, bool>> HasSocket =
        (cooler, socketId) => cooler.CpuCoolerSockets.Any(socket => socket.SocketId == socketId);

    private static readonly Func<CpuCooler, Guid, bool> HasSocketCompiled = HasSocket.Compile();

    public static PartsCompatibilityResult Evaluate(CpuCooler cooler, Cpu cpu) =>
        HasSocketCompiled(cooler, cpu.SocketId)
            ? PartsCompatibilityResult.Compatible()
            : PartsCompatibilityResult.Incompatible(
                CompatibilityReason.MissingCpuCoolerSocket,
                [
                    new CompatibilityFact(
                        CompatibilityAspect.Socket,
                        string.Join(
                            ',',
                            cooler.CpuCoolerSockets.Select(socket =>
                                CompatibilityFact.NameOrId(socket.Socket, socket.SocketId))),
                        CompatibilityFact.NameOrId(cpu.Socket, cpu.SocketId))
                ]);

    public static Expression<Func<CpuCooler, bool>> Filter(Guid socketId) =>
        CompatibilityExpression.Bind(HasSocket, socketId);
}

public static class CpuCoolerRamCompatibility
{
    private static readonly Expression<Func<CpuCooler, decimal, bool>> ExceedsRamHeight =
        (cooler, ramHeightMm) =>
            cooler.Type == CpuCoolerType.Air
            && cooler.CoolerHeightMm != null
            && cooler.MaxRamHeightMm != null
            && ramHeightMm > cooler.MaxRamHeightMm;

    private static readonly Func<CpuCooler, decimal, bool> ExceedsCompiled = ExceedsRamHeight.Compile();

    public static PartsCompatibilityResult Evaluate(CpuCooler cooler, Ram ram)
    {
        if (!ExceedsCompiled(cooler, ram.HeightMm) || cooler.MaxRamHeightMm is not decimal limit)
            return PartsCompatibilityResult.Compatible();

        return PartsCompatibilityResult.Incompatible(
            CompatibilityReason.RamHeightExceedsCoolerLimit,
            [
                new CompatibilityFact(
                    CompatibilityAspect.RamHeightMm,
                    CompatibilityFact.Number(limit),
                    CompatibilityFact.Number(ram.HeightMm))
            ]);
    }

    public static Expression<Func<CpuCooler, bool>> Filter(decimal ramHeightMm) =>
        CompatibilityExpression.Not(CompatibilityExpression.Bind(ExceedsRamHeight, ramHeightMm));
}
