using PcBuilderBackend.Application.Build.Dto;
using PcBuilderBackend.Application.Common.Interfaces;
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
            results.Add(FromBool(
                parts.Chassis.CheckMotherboardCompatibility(parts.Motherboard),
                CompatibilityReason.PartSizeExceedsLimits,
                Ref(CompatibilitySlot.Chassis, parts.Chassis.Id),
                Ref(CompatibilitySlot.Motherboard, parts.Motherboard.Id)));

        if (parts.Motherboard is not null && parts.Cpu is not null)
            results.Add(Wrap(
                parts.Motherboard.CheckCpuCompatibility(parts.Cpu),
                Ref(CompatibilitySlot.Motherboard, parts.Motherboard.Id),
                Ref(CompatibilitySlot.Cpu, parts.Cpu.Id)));

        if (parts.Motherboard is not null && parts.RamKit is not null)
            results.Add(FromBool(
                parts.Motherboard.CheckMemoryCompatibility(parts.RamKit),
                CompatibilityReason.NoMatchingRamConfig,
                Ref(CompatibilitySlot.Motherboard, parts.Motherboard.Id),
                Ref(CompatibilitySlot.RamKit, parts.RamKit.Id)));

        if (parts.Cpu is not null && parts.RamKit is not null)
            results.Add(Wrap(
                parts.Cpu.CheckMemoryCompatibility(parts.RamKit),
                Ref(CompatibilitySlot.Cpu, parts.Cpu.Id),
                Ref(CompatibilitySlot.RamKit, parts.RamKit.Id)));
    }

    private static void AddCoolingChecks(List<CompatibilityCheck> results, LoadedParts parts)
    {
        if (parts.Cpu is not null && !parts.Cpu.IncludedStockCooler && parts.CpuCooler is null)
            results.Add(Wrap(
                PartsCompatibilityResult.Incompatible(CompatibilityReason.CpuCoolerRequired),
                Ref(CompatibilitySlot.Cpu, parts.Cpu.Id),
                Ref(CompatibilitySlot.CpuCooler, null)));

        if (parts.Cpu is not null && parts.CpuCooler is not null)
            results.Add(Wrap(
                parts.CpuCooler.CheckCompatibility(parts.Cpu),
                Ref(CompatibilitySlot.CpuCooler, parts.CpuCooler.Id),
                Ref(CompatibilitySlot.Cpu, parts.Cpu.Id)));

        if (parts.Chassis is not null && parts.CpuCooler is not null)
            results.Add(FromBool(
                parts.Chassis.CheckCpuCoolerCompatibility(parts.CpuCooler),
                CompatibilityReason.PartSizeExceedsLimits,
                Ref(CompatibilitySlot.Chassis, parts.Chassis.Id),
                Ref(CompatibilitySlot.CpuCooler, parts.CpuCooler.Id)));

        if (parts.RamKit is not null && parts.CpuCooler is not null)
            results.Add(Wrap(
                parts.CpuCooler.CheckCompatibility(parts.RamKit),
                Ref(CompatibilitySlot.CpuCooler, parts.CpuCooler.Id),
                Ref(CompatibilitySlot.RamKit, parts.RamKit.Id)));
    }

    private static void AddGraphicsChecks(List<CompatibilityCheck> results, LoadedParts parts)
    {
        if (parts.Chassis is not null && parts.GraphicsCard is not null)
            results.Add(FromBool(
                parts.Chassis.CheckGraphicsCardCompatibility(parts.GraphicsCard),
                CompatibilityReason.PartSizeExceedsLimits,
                Ref(CompatibilitySlot.Chassis, parts.Chassis.Id),
                Ref(CompatibilitySlot.GraphicsCard, parts.GraphicsCard.Id)));

        if (parts.Motherboard is not null && parts.GraphicsCard is not null)
            results.Add(Wrap(
                parts.Motherboard.CheckGraphicsCardCompatibility(parts.GraphicsCard),
                Ref(CompatibilitySlot.Motherboard, parts.Motherboard.Id),
                Ref(CompatibilitySlot.GraphicsCard, parts.GraphicsCard.Id)));

        if (parts.Cpu is not null && parts.GraphicsCard is null && !parts.Cpu.IntegratedGraphics)
            results.Add(Wrap(
                PartsCompatibilityResult.Incompatible(CompatibilityReason.RequiresIntegratedGraphics),
                Ref(CompatibilitySlot.Cpu, parts.Cpu.Id),
                Ref(CompatibilitySlot.GraphicsCard, null)));
    }

    private static void AddPowerChecks(List<CompatibilityCheck> results, LoadedParts parts)
    {
        if (parts.Chassis is not null && parts.Psu is not null)
            results.Add(FromBool(
                parts.Chassis.CheckPsuCompatibility(parts.Psu),
                CompatibilityReason.PartSizeExceedsLimits,
                Ref(CompatibilitySlot.Chassis, parts.Chassis.Id),
                Ref(CompatibilitySlot.Psu, parts.Psu.Id)));

        if (parts.Psu is not null && parts.Motherboard is not null)
            results.Add(Wrap(
                parts.Psu.CheckMotherboardCompatibility(parts.Motherboard),
                Ref(CompatibilitySlot.Psu, parts.Psu.Id),
                Ref(CompatibilitySlot.Motherboard, parts.Motherboard.Id)));

        if (parts.Psu is not null && parts.GraphicsCard is not null)
            results.Add(Wrap(
                parts.Psu.CheckGraphicsCardCompatibility(parts.GraphicsCard),
                Ref(CompatibilitySlot.Psu, parts.Psu.Id),
                Ref(CompatibilitySlot.GraphicsCard, parts.GraphicsCard.Id)));

        AddPowerBudgetCheck(results, parts);
    }

    private static void AddPowerBudgetCheck(List<CompatibilityCheck> results, LoadedParts parts)
    {
        if (parts.Psu is null || parts.Cpu is null)
            return;

        var powerParts = new List<CompatibilityPartRef>
        {
            Ref(CompatibilitySlot.Psu, parts.Psu.Id),
            Ref(CompatibilitySlot.Cpu, parts.Cpu.Id)
        };
        if (parts.GraphicsCard is not null)
            powerParts.Add(Ref(CompatibilitySlot.GraphicsCard, parts.GraphicsCard.Id));

        results.Add(Wrap(parts.Psu.CheckPowerBudget(parts.Cpu, parts.GraphicsCard), powerParts));
    }

    private static void AddCollectionChecks(List<CompatibilityCheck> results, LoadedParts parts)
    {
        if (parts.Chassis is not null && parts.Fans.Count > 0)
            results.Add(FromBool(
                parts.Chassis.CheckFanCompatibility(parts.Fans),
                CompatibilityReason.PartSizeExceedsLimits,
                Collection(
                    Ref(CompatibilitySlot.Chassis, parts.Chassis.Id),
                    CompatibilitySlot.ChassisFans,
                    parts.Fans.Select(fan => fan.Id))));

        if (parts.Motherboard is not null && parts.Fans.Count > 0)
            results.Add(Wrap(
                parts.Motherboard.CheckFanHeaderCompatibility(parts.Fans),
                Collection(
                    Ref(CompatibilitySlot.Motherboard, parts.Motherboard.Id),
                    CompatibilitySlot.ChassisFans,
                    parts.Fans.Select(fan => fan.Id))));

        if (parts.Chassis is not null && parts.Drives.Count > 0)
            results.Add(FromBool(
                parts.Chassis.CheckStorageDriveCompatibility(parts.Drives),
                CompatibilityReason.PartSizeExceedsLimits,
                Collection(
                    Ref(CompatibilitySlot.Chassis, parts.Chassis.Id),
                    CompatibilitySlot.StorageDevices,
                    parts.Drives.Select(drive => drive.Id))));

        if (parts.Motherboard is not null && parts.Drives.Count > 0)
            results.Add(Wrap(
                parts.Motherboard.CheckStorageCompatibility(parts.Drives),
                Collection(
                    Ref(CompatibilitySlot.Motherboard, parts.Motherboard.Id),
                    CompatibilitySlot.StorageDevices,
                    parts.Drives.Select(drive => drive.Id))));

        if (parts.Psu is not null && parts.Drives.Count > 0)
            results.Add(Wrap(
                parts.Psu.CheckStorageCompatibility(parts.Drives),
                Collection(
                    Ref(CompatibilitySlot.Psu, parts.Psu.Id),
                    CompatibilitySlot.StorageDevices,
                    parts.Drives.Select(drive => drive.Id))));

        if (parts.Motherboard is not null && (parts.Wired.Count > 0 || parts.Wireless.Count > 0))
            results.Add(Wrap(
                parts.Motherboard.CheckNetworkAdapterCompatibility(parts.Wired, parts.Wireless),
                NetworkRefs(
                    parts.Motherboard.Id,
                    parts.Wired.Select(adapter => adapter.Id),
                    parts.Wireless.Select(adapter => adapter.Id))));
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

    private static CompatibilityPartRef Ref(CompatibilitySlot slot, Guid? partId) => new(slot, partId);

    private static List<CompatibilityPartRef> Collection(
        CompatibilityPartRef host,
        CompatibilitySlot slot,
        IEnumerable<Guid> partIds)
    {
        var parts = new List<CompatibilityPartRef> { host };
        parts.AddRange(partIds.Distinct().Select(id => Ref(slot, id)));
        return parts;
    }

    private static List<CompatibilityPartRef> NetworkRefs(
        Guid motherboardId,
        IEnumerable<Guid> wiredIds,
        IEnumerable<Guid> wirelessIds)
    {
        var parts = new List<CompatibilityPartRef> { Ref(CompatibilitySlot.Motherboard, motherboardId) };
        parts.AddRange(wiredIds.Distinct().Select(id => Ref(CompatibilitySlot.WiredNetworkAdapters, id)));
        parts.AddRange(wirelessIds.Distinct().Select(id => Ref(CompatibilitySlot.WirelessNetworkAdapters, id)));
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
        params CompatibilityPartRef[] parts) =>
        Wrap(
            compatible
                ? PartsCompatibilityResult.Compatible()
                : PartsCompatibilityResult.Incompatible(reason),
            parts);

    private static CompatibilityCheck FromBool(
        bool compatible,
        CompatibilityReason reason,
        IReadOnlyList<CompatibilityPartRef> parts) =>
        Wrap(
            compatible
                ? PartsCompatibilityResult.Compatible()
                : PartsCompatibilityResult.Incompatible(reason),
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
