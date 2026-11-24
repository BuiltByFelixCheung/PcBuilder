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

    public static PartsCompatibilityResult Evaluate(Motherboard board, Cpu cpu)
    {
        if (!SocketCompiled(cpu, board.SocketId))
        {
            return PartsCompatibilityResult.Incompatible(
                CompatibilityReason.SocketMismatch,
                [
                    new CompatibilityFact(
                        CompatibilityAspect.Socket,
                        CompatibilityFact.NameOrId(board.Socket, board.SocketId),
                        CompatibilityFact.NameOrId(cpu.Socket, cpu.SocketId))
                ]);
        }

        if (!ChipsetCompiled(cpu, board.ChipsetId))
        {
            return PartsCompatibilityResult.Incompatible(
                CompatibilityReason.ChipsetNotSupported,
                [
                    new CompatibilityFact(
                        CompatibilityAspect.Chipset,
                        CompatibilityFact.NameOrId(board.Chipset, board.ChipsetId),
                        SupportedChipsets(cpu))
                ]);
        }

        if (BiosCompiled(cpu, board.ChipsetId))
        {
            return PartsCompatibilityResult.CompatibleActionRequired(
                CompatibilityReason.RequiresBiosUpdate,
                [
                    new CompatibilityFact(
                        CompatibilityAspect.Chipset,
                        CompatibilityFact.NameOrId(board.Chipset, board.ChipsetId),
                        null)
                ]);
        }

        return PartsCompatibilityResult.Compatible();
    }

    private static string SupportedChipsets(Cpu cpu) =>
        string.Join(
            ',',
            cpu.SupportedChipsets.Select(support =>
                CompatibilityFact.NameOrId(support.Chipset, support.ChipsetId)));

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
        {
            var available = list.Where(slot => slot.SlotType == PcieSlotType.X16).Sum(slot => slot.SlotCount);
            return PartsCompatibilityResult.Incompatible(
                CompatibilityReason.NotEnoughPcieSlots,
                [
                    new CompatibilityFact(
                        CompatibilityAspect.PcieSlotCount,
                        CompatibilityFact.Number(available),
                        "X16|1")
                ]);
        }

        var maxBoardGeneration = list.Max(slot => slot.Generation);
        return GenerationCompiled(card.PcieGeneration, maxBoardGeneration)
            ? PartsCompatibilityResult.CompatibleReduced(
                CompatibilityReason.PcieGenerationReduced,
                rated: card.PcieGeneration,
                executing: maxBoardGeneration)
            : PartsCompatibilityResult.Compatible();
    }
}
