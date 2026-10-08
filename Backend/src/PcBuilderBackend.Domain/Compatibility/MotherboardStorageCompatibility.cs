using System.Linq.Expressions;
using PcBuilderBackend.Domain.Entities;
using PcBuilderBackend.Domain.Enums;
using PcBuilderBackend.Domain.ValueObjects;

namespace PcBuilderBackend.Domain.Compatibility;

public static class MotherboardStorageCompatibility
{
    private static readonly Expression<Func<StorageFormFactor, bool>> ConsumesSataPort =
        form => form == StorageFormFactor.Sata25 || form == StorageFormFactor.Sata35;

    private static readonly Func<StorageFormFactor, bool> ConsumesSataPortCompiled = ConsumesSataPort.Compile();

    private static readonly Expression<Func<int, int, bool>> SataCountFits =
        (sataCount, sataPorts) => sataCount <= sataPorts;

    private static readonly Func<int, int, bool> SataCountFitsCompiled = SataCountFits.Compile();

    public static PartsCompatibilityResult Evaluate(
        int sataPorts,
        IReadOnlyCollection<MotherboardM2> m2Slots,
        IEnumerable<StorageDrive> drives)
    {
        var list = drives as IList<StorageDrive> ?? [.. drives];
        if (list.Count == 0)
            return PartsCompatibilityResult.Compatible();

        foreach (var drive in list)
        {
            if (ConsumesSataPortCompiled(drive.FormFactor) || StorageDriveCompatibility.IsM2Form(drive.FormFactor))
                continue;

            throw new ArgumentOutOfRangeException(nameof(drives), "Storage form factor is not recognized.");
        }

        var sataBayCount = list.Count(drive => ConsumesSataPortCompiled(drive.FormFactor));
        if (!SataCountFitsCompiled(sataBayCount, sataPorts))
            return PartsCompatibilityResult.Incompatible(CompatibilityReason.InsufficientSataPorts);

        return AssignM2Demands(m2Slots, list.Where(drive => drive.IsM2).Select(ToM2Demand));
    }

    internal static PartsCompatibilityResult AssignWireless(
        IReadOnlyCollection<MotherboardM2> m2Slots,
        IEnumerable<WirelessNetworkAdapter> adapters) =>
        AssignM2Demands(
            m2Slots,
            adapters.Select(adapter => new M2Demand(
                adapter.Key!.Value,
                adapter.M2FormFactor!.Value,
                RequiresSata: false,
                Generation: null)));

    public static Expression<Func<StorageDrive, bool>> Filter(
        int sataPorts,
        IReadOnlyCollection<MotherboardM2> m2Slots)
    {
        var clauses = new List<Expression<Func<StorageDrive, bool>>>();
        if (SataCountFitsCompiled(1, sataPorts))
            clauses.Add(ConsumesSataBay());

        foreach (var slot in m2Slots)
        {
            foreach (var form in slot.FormFactors)
            {
                clauses.Add(StorageDriveCompatibility.M2SlotFits(
                    slot.Key,
                    form.FormFactor,
                    slot.SupportsSata,
                    slot.SlotCount));
            }
        }

        return CompatibilityExpression.Or(clauses.ToArray());
    }

    private static Expression<Func<StorageDrive, bool>> ConsumesSataBay()
    {
        var drive = Expression.Parameter(typeof(StorageDrive), "drive");
        var form = Expression.Property(drive, nameof(StorageDrive.FormFactor));
        var body = CompatibilityExpression.Inline(ConsumesSataPort, form);
        return Expression.Lambda<Func<StorageDrive, bool>>(body, drive);
    }

    private static PartsCompatibilityResult AssignM2Demands(
        IReadOnlyCollection<MotherboardM2> m2Slots,
        IEnumerable<M2Demand> demands)
    {
        var list = demands as IList<M2Demand> ?? [.. demands];
        if (list.Count == 0)
            return PartsCompatibilityResult.Compatible();

        var remaining = m2Slots.ToDictionary(slot => slot, slot => slot.SlotCount);
        PartsCompatibilityResult? reduced = null;

        foreach (var demand in list.OrderBy(demand => CountM2Candidates(m2Slots, demand)))
        {
            var result = TryConsumeM2Slot(m2Slots, demand, remaining);
            if (result.Status == PartsCompatibility.Incompatible)
                return result;

            if (result.Status == PartsCompatibility.CompatibleReduced)
                reduced = result;
        }

        return reduced ?? PartsCompatibilityResult.Compatible();
    }

    private static int CountM2Candidates(IReadOnlyCollection<MotherboardM2> m2Slots, M2Demand demand) =>
        m2Slots.Count(slot => IsM2Candidate(slot, demand));

    private static PartsCompatibilityResult TryConsumeM2Slot(
        IReadOnlyCollection<MotherboardM2> m2Slots,
        M2Demand demand,
        Dictionary<MotherboardM2, int> remaining)
    {
        var candidates = m2Slots.Where(slot => IsM2Candidate(slot, demand)).ToList();
        if (candidates.Count == 0)
        {
            if (demand.RequiresSata && m2Slots.Any(slot => MatchesM2KeyAndForm(slot, demand)))
                return PartsCompatibilityResult.Incompatible(CompatibilityReason.SlotDoesNotSupportSata);

            return PartsCompatibilityResult.Incompatible(CompatibilityReason.NoMatchingM2Slot);
        }

        var available = candidates.Where(slot => remaining[slot] > 0).ToList();
        if (available.Count == 0)
            return PartsCompatibilityResult.Incompatible(CompatibilityReason.NoMatchingM2Slot);

        var chosen = available.MaxBy(slot => slot.PcieGeneration)!;
        remaining[chosen]--;

        if (demand.Generation is { } generation && generation > chosen.PcieGeneration)
        {
            return PartsCompatibilityResult.CompatibleReduced(
                CompatibilityReason.PcieGenerationReduced,
                rated: generation,
                executing: chosen.PcieGeneration);
        }

        return PartsCompatibilityResult.Compatible();
    }

    private static bool IsM2Candidate(MotherboardM2 slot, M2Demand demand) =>
        MatchesM2KeyAndForm(slot, demand) && (!demand.RequiresSata || slot.SupportsSata);

    private static bool MatchesM2KeyAndForm(MotherboardM2 slot, M2Demand demand) =>
        M2KeyCompatibility.FitsSlot(demand.Key, slot.Key)
        && slot.FormFactors.Any(formFactor => formFactor.FormFactor == demand.FormFactor);

    private static M2Demand ToM2Demand(StorageDrive drive) =>
        new(
            drive.ModuleKey!.Value,
            drive.M2FormFactor!.Value,
            drive.Interface == StorageInterface.Sata,
            drive.Interface == StorageInterface.Nvme ? drive.PcieGeneration : null);

    private readonly record struct M2Demand(
        M2Key Key,
        M2FormFactor FormFactor,
        bool RequiresSata,
        PcieGeneration? Generation);
}
