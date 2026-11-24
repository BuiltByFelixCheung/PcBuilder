using System.Linq.Expressions;
using PcBuilderBackend.Domain.Entities;
using PcBuilderBackend.Domain.Enums;
using PcBuilderBackend.Domain.ValueObjects;

namespace PcBuilderBackend.Domain.Compatibility;

public static class MotherboardMemoryCompatibility
{
    private static readonly Expression<Func<Ram, DdrGeneration, RamFormFactor, int, int, int, bool>> Body =
        (memory, ddr, formFactor, maxMemoryGb, maxDimmSizeGb, ramSlots) =>
            memory.DdrGeneration == ddr
            && memory.RamFormFactor == formFactor
            && memory.TotalMemorySizeGb <= maxMemoryGb
            && memory.MemorySizePerStickGb <= maxDimmSizeGb
            && memory.ModulesCount <= ramSlots;

    private static readonly Func<Ram, DdrGeneration, RamFormFactor, int, int, int, bool> Compiled = Body.Compile();

    public static bool Matches(Motherboard board, Ram memory) =>
        Compiled(
            memory,
            board.DdrGeneration,
            board.RamFormFactor,
            board.MaxMemoryGb,
            board.MaxDimmSizeGb,
            board.RamSlots);

    public static IReadOnlyList<CompatibilityFact> Explain(Motherboard board, Ram memory)
    {
        var facts = new List<CompatibilityFact>();
        if (memory.DdrGeneration != board.DdrGeneration)
        {
            facts.Add(new CompatibilityFact(
                CompatibilityAspect.DdrGeneration,
                CompatibilityFact.Token(board.DdrGeneration),
                CompatibilityFact.Token(memory.DdrGeneration)));
        }

        if (memory.RamFormFactor != board.RamFormFactor)
        {
            facts.Add(new CompatibilityFact(
                CompatibilityAspect.RamFormFactor,
                CompatibilityFact.Token(board.RamFormFactor),
                CompatibilityFact.Token(memory.RamFormFactor)));
        }

        if (memory.TotalMemorySizeGb > board.MaxMemoryGb)
        {
            facts.Add(new CompatibilityFact(
                CompatibilityAspect.TotalMemoryGb,
                CompatibilityFact.Number(board.MaxMemoryGb),
                CompatibilityFact.Number(memory.TotalMemorySizeGb)));
        }

        if (memory.MemorySizePerStickGb > board.MaxDimmSizeGb)
        {
            facts.Add(new CompatibilityFact(
                CompatibilityAspect.DimmSizeGb,
                CompatibilityFact.Number(board.MaxDimmSizeGb),
                CompatibilityFact.Number(memory.MemorySizePerStickGb)));
        }

        if (memory.ModulesCount > board.RamSlots)
        {
            facts.Add(new CompatibilityFact(
                CompatibilityAspect.ModuleCount,
                CompatibilityFact.Number(board.RamSlots),
                CompatibilityFact.Number(memory.ModulesCount)));
        }

        return facts;
    }

    public static Expression<Func<Ram, bool>> Filter(Motherboard board) =>
        CompatibilityExpression.Bind<Ram>(
            Body,
            board.DdrGeneration,
            board.RamFormFactor,
            board.MaxMemoryGb,
            board.MaxDimmSizeGb,
            board.RamSlots);
}

public static class CpuMemoryCompatibility
{
    private static readonly Expression<Func<Ram, DdrGeneration, int, RamRank, bool>> ConfigMatches =
        (memory, ddr, modules, rank) =>
            memory.DdrGeneration == ddr
            && memory.ModulesCount == modules
            && memory.RamRank == rank;

    private static readonly Expression<Func<Ram, int, bool>> SpeedExceeds =
        (memory, maxSpeedMts) => memory.MaxMemorySpeedMts > maxSpeedMts;

    private static readonly Func<Ram, DdrGeneration, int, RamRank, bool> ConfigCompiled = ConfigMatches.Compile();
    private static readonly Func<Ram, int, bool> SpeedCompiled = SpeedExceeds.Compile();

    public static PartsCompatibilityResult Evaluate(Cpu cpu, Ram memory)
    {
        CpuRamCompat? match = null;
        foreach (var compat in cpu.RamCompats)
        {
            if (!ConfigCompiled(memory, compat.DdrGeneration, compat.RamModuleCount, compat.RamRank))
                continue;

            match = compat;
            break;
        }

        if (match is null)
        {
            return PartsCompatibilityResult.Incompatible(
                CompatibilityReason.NoMatchingRamConfig,
                [
                    new CompatibilityFact(
                        CompatibilityAspect.DdrGeneration,
                        null,
                        CompatibilityFact.Token(memory.DdrGeneration)),
                    new CompatibilityFact(
                        CompatibilityAspect.ModuleCount,
                        null,
                        CompatibilityFact.Number(memory.ModulesCount)),
                    new CompatibilityFact(
                        CompatibilityAspect.RamRank,
                        null,
                        CompatibilityFact.Token(memory.RamRank))
                ]);
        }

        return SpeedCompiled(memory, match.MaxSpeedMts)
            ? PartsCompatibilityResult.CompatibleReduced(
                CompatibilityReason.MemorySpeedExceedsCpuSupport,
                rated: memory.MaxMemorySpeedMts,
                executing: match.MaxSpeedMts)
            : PartsCompatibilityResult.Compatible();
    }

    public static Expression<Func<Ram, bool>> Filter(Cpu cpu)
    {
        var clauses = cpu.RamCompats
            .Select(compat => CompatibilityExpression.Bind<Ram>(
                ConfigMatches,
                compat.DdrGeneration,
                compat.RamModuleCount,
                compat.RamRank))
            .ToArray();

        return CompatibilityExpression.Or(clauses);
    }
}
