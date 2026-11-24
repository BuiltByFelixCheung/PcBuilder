using PcBuilderBackend.Application.Build.Dto;
using PcBuilderBackend.Application.Common.Interfaces;
using PcBuilderBackend.Domain.Compatibility;
using PcBuilderBackend.Domain.Entities;
using PcBuilderBackend.Domain.Enums;
using PcBuilderBackend.Domain.ValueObjects;

namespace PcBuilderBackend.Application.Build;

public interface ICompatibilityChecker
{
    Task<List<CompatibilityCheck>> CheckCompatibilityAsync(CompatibilityCheckRequest request);
}

public class CompatibilityChecker(ICatalogRepository catalog) : ICompatibilityChecker
{
    public async Task<List<CompatibilityCheck>> CheckCompatibilityAsync(CompatibilityCheckRequest request)
    {
        var parts = await LoadPartsAsync(request);
        return Evaluate(parts);
    }

    private async Task<LoadedParts> LoadPartsAsync(CompatibilityCheckRequest request)
    {
        return new LoadedParts(
            await LoadOptional(request.ChassisId, catalog.GetChassisByIdAsync),
            await LoadOptional(request.MotherboardId, catalog.GetMotherboardByIdAsync),
            await LoadOptional(request.CpuId, catalog.GetCpuByIdAsync),
            await LoadOptional(request.CpuCoolerId, catalog.GetCpuCoolerByIdAsync),
            await LoadOptional(request.RamKitId, catalog.GetRamByIdAsync),
            await LoadOptional(request.GraphicsCardId, catalog.GetGraphicsCardByIdAsync),
            await LoadOptional(request.PsuId, catalog.GetPowerSupplyByIdAsync),
            Expand(
                request.ChassisFans,
                (await catalog.GetChassisFansByIdsAsync(DistinctIds(request.ChassisFans))).ToDictionary(x => x.Id)),
            Expand(
                request.StorageDevices,
                (await catalog.GetStorageDevicesByIdsAsync(DistinctIds(request.StorageDevices))).ToDictionary(x => x.Id)),
            Expand(
                request.WiredNetworkAdapters,
                (await catalog.GetWiredNetworkAdaptersByIdsAsync(DistinctIds(request.WiredNetworkAdapters)))
                    .ToDictionary(x => x.Id)),
            Expand(
                request.WirelessNetworkAdapters,
                (await catalog.GetWirelessNetworkAdaptersByIdsAsync(DistinctIds(request.WirelessNetworkAdapters)))
                    .ToDictionary(x => x.Id)));
    }

    private static List<CompatibilityCheck> Evaluate(LoadedParts parts)
    {
        var results = new List<CompatibilityCheck>();
        AddPairChecks(results, parts);
        AddCoolingChecks(results, parts);
        AddGraphicsChecks(results, parts);
        AddPowerChecks(results, parts);
        AddCollectionChecks(results, parts);
        return results;
    }

    private static void AddPairChecks(List<CompatibilityCheck> results, LoadedParts parts)
    {
        if (parts.Chassis is not null && parts.Motherboard is not null)
        {
            var compatible = parts.Chassis.CheckMotherboardCompatibility(parts.Motherboard);
            results.Add(FromBool(
                compatible,
                CompatibilityReason.PartSizeExceedsLimits,
                compatible ? [] : ChassisMotherboardCompatibility.Explain(parts.Chassis, parts.Motherboard),
                Ref(CompatibilitySlot.Chassis, parts.Chassis),
                Ref(CompatibilitySlot.Motherboard, parts.Motherboard)));
        }

        if (parts.Motherboard is not null && parts.Cpu is not null)
            results.Add(Wrap(
                parts.Motherboard.CheckCpuCompatibility(parts.Cpu),
                Ref(CompatibilitySlot.Motherboard, parts.Motherboard),
                Ref(CompatibilitySlot.Cpu, parts.Cpu)));

        if (parts.Motherboard is not null && parts.RamKit is not null)
        {
            var compatible = parts.Motherboard.CheckMemoryCompatibility(parts.RamKit);
            results.Add(FromBool(
                compatible,
                CompatibilityReason.NoMatchingRamConfig,
                compatible ? [] : MotherboardMemoryCompatibility.Explain(parts.Motherboard, parts.RamKit),
                Ref(CompatibilitySlot.Motherboard, parts.Motherboard),
                Ref(CompatibilitySlot.RamKit, parts.RamKit)));
        }

        if (parts.Cpu is not null && parts.RamKit is not null)
            results.Add(Wrap(
                parts.Cpu.CheckMemoryCompatibility(parts.RamKit),
                Ref(CompatibilitySlot.Cpu, parts.Cpu),
                Ref(CompatibilitySlot.RamKit, parts.RamKit)));
    }

    private static void AddCoolingChecks(List<CompatibilityCheck> results, LoadedParts parts)
    {
        if (parts.Cpu is not null && !parts.Cpu.IncludedStockCooler && parts.CpuCooler is null)
            results.Add(Wrap(
                PartsCompatibilityResult.Incompatible(CompatibilityReason.CpuCoolerRequired),
                Ref(CompatibilitySlot.Cpu, parts.Cpu),
                Ref(CompatibilitySlot.CpuCooler, null)));

        if (parts.Cpu is not null && parts.CpuCooler is not null)
            results.Add(Wrap(
                parts.CpuCooler.CheckCompatibility(parts.Cpu),
                Ref(CompatibilitySlot.CpuCooler, parts.CpuCooler),
                Ref(CompatibilitySlot.Cpu, parts.Cpu)));

        if (parts.Chassis is not null && parts.CpuCooler is not null)
        {
            var compatible = parts.Chassis.CheckCpuCoolerCompatibility(parts.CpuCooler);
            results.Add(FromBool(
                compatible,
                CompatibilityReason.PartSizeExceedsLimits,
                compatible ? [] : ChassisCpuCoolerCompatibility.Explain(parts.Chassis, parts.CpuCooler),
                Ref(CompatibilitySlot.Chassis, parts.Chassis),
                Ref(CompatibilitySlot.CpuCooler, parts.CpuCooler)));
        }

        if (parts.RamKit is not null && parts.CpuCooler is not null)
            results.Add(Wrap(
                parts.CpuCooler.CheckCompatibility(parts.RamKit),
                Ref(CompatibilitySlot.CpuCooler, parts.CpuCooler),
                Ref(CompatibilitySlot.RamKit, parts.RamKit)));
    }

    private static void AddGraphicsChecks(List<CompatibilityCheck> results, LoadedParts parts)
    {
        if (parts.Chassis is not null && parts.GraphicsCard is not null)
        {
            var compatible = parts.Chassis.CheckGraphicsCardCompatibility(parts.GraphicsCard);
            results.Add(FromBool(
                compatible,
                CompatibilityReason.PartSizeExceedsLimits,
                compatible ? [] : ChassisGraphicsCardCompatibility.Explain(parts.Chassis, parts.GraphicsCard),
                Ref(CompatibilitySlot.Chassis, parts.Chassis),
                Ref(CompatibilitySlot.GraphicsCard, parts.GraphicsCard)));
        }

        if (parts.Motherboard is not null && parts.GraphicsCard is not null)
            results.Add(Wrap(
                parts.Motherboard.CheckGraphicsCardCompatibility(parts.GraphicsCard),
                Ref(CompatibilitySlot.Motherboard, parts.Motherboard),
                Ref(CompatibilitySlot.GraphicsCard, parts.GraphicsCard)));

        if (parts.Cpu is not null && parts.GraphicsCard is null && !parts.Cpu.IntegratedGraphics)
            results.Add(Wrap(
                PartsCompatibilityResult.Incompatible(CompatibilityReason.RequiresIntegratedGraphics),
                Ref(CompatibilitySlot.Cpu, parts.Cpu),
                Ref(CompatibilitySlot.GraphicsCard, null)));
    }

    private static void AddPowerChecks(List<CompatibilityCheck> results, LoadedParts parts)
    {
        if (parts.Chassis is not null && parts.Psu is not null)
        {
            var compatible = parts.Chassis.CheckPsuCompatibility(parts.Psu);
            results.Add(FromBool(
                compatible,
                CompatibilityReason.PartSizeExceedsLimits,
                compatible ? [] : ChassisPsuCompatibility.Explain(parts.Chassis, parts.Psu),
                Ref(CompatibilitySlot.Chassis, parts.Chassis),
                Ref(CompatibilitySlot.Psu, parts.Psu)));
        }

        if (parts.Psu is not null && parts.Motherboard is not null)
            results.Add(Wrap(
                parts.Psu.CheckMotherboardCompatibility(parts.Motherboard),
                Ref(CompatibilitySlot.Psu, parts.Psu),
                Ref(CompatibilitySlot.Motherboard, parts.Motherboard)));

        if (parts.Psu is not null && parts.GraphicsCard is not null)
            results.Add(Wrap(
                parts.Psu.CheckGraphicsCardCompatibility(parts.GraphicsCard),
                Ref(CompatibilitySlot.Psu, parts.Psu),
                Ref(CompatibilitySlot.GraphicsCard, parts.GraphicsCard)));

        AddPowerBudgetCheck(results, parts);
    }

    private static void AddPowerBudgetCheck(List<CompatibilityCheck> results, LoadedParts parts)
    {
        if (parts.Psu is null || parts.Cpu is null)
            return;

        var powerParts = new List<CompatibilityPartRef>
        {
            Ref(CompatibilitySlot.Psu, parts.Psu),
            Ref(CompatibilitySlot.Cpu, parts.Cpu)
        };
        if (parts.GraphicsCard is not null)
            powerParts.Add(Ref(CompatibilitySlot.GraphicsCard, parts.GraphicsCard));

        results.Add(Wrap(parts.Psu.CheckPowerBudget(parts.Cpu, parts.GraphicsCard), powerParts));
    }

    private static void AddCollectionChecks(List<CompatibilityCheck> results, LoadedParts parts)
    {
        if (parts.Chassis is not null && parts.Fans.Count > 0)
        {
            var compatible = parts.Chassis.CheckFanCompatibility(parts.Fans);
            results.Add(FromBool(
                compatible,
                CompatibilityReason.PartSizeExceedsLimits,
                compatible ? [] : ChassisFanMountCompatibility.Explain(parts.Chassis, parts.Fans),
                Collection(
                    Ref(CompatibilitySlot.Chassis, parts.Chassis),
                    CompatibilitySlot.ChassisFans,
                    parts.Fans)));
        }

        if (parts.Motherboard is not null && parts.Fans.Count > 0)
            results.Add(Wrap(
                parts.Motherboard.CheckFanHeaderCompatibility(parts.Fans),
                Collection(
                    Ref(CompatibilitySlot.Motherboard, parts.Motherboard),
                    CompatibilitySlot.ChassisFans,
                    parts.Fans)));

        if (parts.Chassis is not null && parts.Drives.Count > 0)
        {
            var compatible = parts.Chassis.CheckStorageDriveCompatibility(parts.Drives);
            results.Add(FromBool(
                compatible,
                CompatibilityReason.PartSizeExceedsLimits,
                compatible ? [] : ChassisStorageCompatibility.Explain(parts.Chassis, parts.Drives),
                Collection(
                    Ref(CompatibilitySlot.Chassis, parts.Chassis),
                    CompatibilitySlot.StorageDevices,
                    parts.Drives)));
        }

        if (parts.Motherboard is not null && parts.Drives.Count > 0)
            results.Add(Wrap(
                parts.Motherboard.CheckStorageCompatibility(parts.Drives),
                Collection(
                    Ref(CompatibilitySlot.Motherboard, parts.Motherboard),
                    CompatibilitySlot.StorageDevices,
                    parts.Drives)));

        if (parts.Psu is not null && parts.Drives.Count > 0)
            results.Add(Wrap(
                parts.Psu.CheckStorageCompatibility(parts.Drives),
                Collection(
                    Ref(CompatibilitySlot.Psu, parts.Psu),
                    CompatibilitySlot.StorageDevices,
                    parts.Drives)));

        if (parts.Motherboard is not null && (parts.Wired.Count > 0 || parts.Wireless.Count > 0))
            results.Add(Wrap(
                parts.Motherboard.CheckNetworkAdapterCompatibility(parts.Wired, parts.Wireless),
                NetworkRefs(parts.Motherboard, parts.Wired, parts.Wireless)));
    }

    private static async Task<T?> LoadOptional<T>(Guid? id, Func<Guid, Task<T?>> load) where T : class =>
        id is { } value ? RequireFound(await load(value), value) : null;

    private static T RequireFound<T>(T? entity, Guid id) where T : class =>
        entity ?? throw new ArgumentException($"Part {id} was not found.");

    private static List<Guid> DistinctIds(IEnumerable<PcBuildPartDto>? rows) =>
        [.. (rows ?? []).Select(row => row.PartId).Distinct()];

    private static List<T> Expand<T>(
        IEnumerable<PcBuildPartDto>? rows,
        IReadOnlyDictionary<Guid, T> byId)
        where T : class
    {
        var expanded = new List<T>();
        foreach (var row in rows ?? [])
        {
            if (!byId.TryGetValue(row.PartId, out var entity))
                throw new ArgumentException($"Part {row.PartId} was not found.", nameof(rows));

            ArgumentOutOfRangeException.ThrowIfNegativeOrZero(row.Quantity);

            for (var i = 0; i < row.Quantity; i++)
                expanded.Add(entity);
        }

        return expanded;
    }

    private static CompatibilityPartRef Ref(CompatibilitySlot slot, Guid? partId, string? name = null) =>
        new(slot, partId, name);

    private static CompatibilityPartRef Ref(CompatibilitySlot slot, ProductEntity part) =>
        new(slot, part.Id, part.Name);

    private static List<CompatibilityPartRef> Collection(
        CompatibilityPartRef host,
        CompatibilitySlot slot,
        IEnumerable<ProductEntity> parts)
    {
        var refs = new List<CompatibilityPartRef> { host };
        refs.AddRange(parts.DistinctBy(part => part.Id).Select(part => Ref(slot, part)));
        return refs;
    }

    private static List<CompatibilityPartRef> NetworkRefs(
        Motherboard motherboard,
        IEnumerable<WiredNetworkAdapter> wired,
        IEnumerable<WirelessNetworkAdapter> wireless)
    {
        var parts = new List<CompatibilityPartRef> { Ref(CompatibilitySlot.Motherboard, motherboard) };
        parts.AddRange(wired.DistinctBy(adapter => adapter.Id)
            .Select(adapter => Ref(CompatibilitySlot.WiredNetworkAdapters, adapter)));
        parts.AddRange(wireless.DistinctBy(adapter => adapter.Id)
            .Select(adapter => Ref(CompatibilitySlot.WirelessNetworkAdapters, adapter)));
        return parts;
    }

    private static CompatibilityCheck Wrap(
        PartsCompatibilityResult result,
        params CompatibilityPartRef[] parts) =>
        new(result, parts);

    private static CompatibilityCheck Wrap(
        PartsCompatibilityResult result,
        IReadOnlyList<CompatibilityPartRef> parts) =>
        new(result, parts);

    private static CompatibilityCheck FromBool(
        bool compatible,
        CompatibilityReason reason,
        IReadOnlyList<CompatibilityFact> facts,
        params CompatibilityPartRef[] parts) =>
        Wrap(
            compatible
                ? PartsCompatibilityResult.Compatible()
                : PartsCompatibilityResult.Incompatible(reason, facts),
            parts);

    private static CompatibilityCheck FromBool(
        bool compatible,
        CompatibilityReason reason,
        IReadOnlyList<CompatibilityFact> facts,
        IReadOnlyList<CompatibilityPartRef> parts) =>
        Wrap(
            compatible
                ? PartsCompatibilityResult.Compatible()
                : PartsCompatibilityResult.Incompatible(reason, facts),
            parts);

    private sealed record LoadedParts(
        Chassis? Chassis,
        Motherboard? Motherboard,
        Cpu? Cpu,
        CpuCooler? CpuCooler,
        Ram? RamKit,
        GraphicsCard? GraphicsCard,
        Psu? Psu,
        List<ChassisFan> Fans,
        List<StorageDrive> Drives,
        List<WiredNetworkAdapter> Wired,
        List<WirelessNetworkAdapter> Wireless);
}
