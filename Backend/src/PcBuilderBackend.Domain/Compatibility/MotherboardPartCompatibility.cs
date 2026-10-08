using System.Linq.Expressions;
using PcBuilderBackend.Domain.Entities;
using PcBuilderBackend.Domain.Enums;
using PcBuilderBackend.Domain.ValueObjects;

namespace PcBuilderBackend.Domain.Compatibility;

public static class MotherboardCpuCompatibility
{
    private static readonly Expression<Func<Cpu, Guid, bool>> SocketMatches =
        (cpu, socketId) => cpu.SocketId == socketId;

    private static readonly Expression<Func<Cpu, Guid, bool>> ChipsetListed =
        (cpu, chipsetId) => cpu.SupportedChipsets.Any(support => support.ChipsetId == chipsetId);

    private static readonly Expression<Func<Cpu, Guid, bool>> BiosUpdateRequired =
        (cpu, chipsetId) => cpu.SupportedChipsets.Any(support =>
            support.ChipsetId == chipsetId && support.RequiresBiosUpdate);

    private static readonly Func<Cpu, Guid, bool> SocketCompiled = SocketMatches.Compile();
    private static readonly Func<Cpu, Guid, bool> ChipsetCompiled = ChipsetListed.Compile();
    private static readonly Func<Cpu, Guid, bool> BiosCompiled = BiosUpdateRequired.Compile();

    public static PartsCompatibilityResult Evaluate(Guid socketId, Guid chipsetId, Cpu cpu)
    {
        if (!SocketCompiled(cpu, socketId))
            return PartsCompatibilityResult.Incompatible(CompatibilityReason.SocketMismatch);

        if (!ChipsetCompiled(cpu, chipsetId))
            return PartsCompatibilityResult.Incompatible(CompatibilityReason.ChipsetNotSupported);

        if (BiosCompiled(cpu, chipsetId))
            return PartsCompatibilityResult.CompatibleActionRequired(CompatibilityReason.RequiresBiosUpdate);

        return PartsCompatibilityResult.Compatible();
    }

    public static Expression<Func<Cpu, bool>> SocketFilter(Guid socketId) =>
        CompatibilityExpression.Bind(SocketMatches, socketId);

    public static Expression<Func<Cpu, bool>> ChipsetFilter(Guid chipsetId) =>
        CompatibilityExpression.Bind(ChipsetListed, chipsetId);
}

public static class MotherboardGraphicsCompatibility
{
    private static readonly Expression<Func<PcieGeneration, PcieGeneration, bool>> GenerationExceeds =
        (cardGeneration, maxBoardGeneration) => cardGeneration > maxBoardGeneration;

    private static readonly Func<PcieGeneration, PcieGeneration, bool> GenerationCompiled =
        GenerationExceeds.Compile();

    public static bool HasX16(IEnumerable<MotherboardPcie> slots) =>
        slots.Any(slot => slot.SlotType == PcieSlotType.X16);

    public static PartsCompatibilityResult Evaluate(IEnumerable<MotherboardPcie> slots, GraphicsCard card)
    {
        var list = slots as IList<MotherboardPcie> ?? [.. slots];
        if (!HasX16(list))
            return PartsCompatibilityResult.Incompatible(CompatibilityReason.NotEnoughPcieSlots);

        var maxBoardGeneration = list.Max(slot => slot.Generation);
        return GenerationCompiled(card.PcieGeneration, maxBoardGeneration)
            ? PartsCompatibilityResult.CompatibleReduced(
                CompatibilityReason.PcieGenerationReduced,
                rated: card.PcieGeneration,
                executing: maxBoardGeneration)
            : PartsCompatibilityResult.Compatible();
    }
}
