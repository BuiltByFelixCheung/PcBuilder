using System.Linq.Expressions;
using PcBuilderBackend.Domain.Entities;
using PcBuilderBackend.Domain.Enums;
using PcBuilderBackend.Domain.ValueObjects;

namespace PcBuilderBackend.Domain.Compatibility;

public static class NetworkAdapterCompatibility
{
    public static PartsCompatibilityResult Evaluate(
        IReadOnlyCollection<MotherboardPcie> pcieSlots,
        IReadOnlyCollection<MotherboardUsb> usbPorts,
        IReadOnlyCollection<MotherboardM2> m2Slots,
        IEnumerable<WiredNetworkAdapter> wired,
        IEnumerable<WirelessNetworkAdapter> wireless)
    {
        var wiredList = wired as IList<WiredNetworkAdapter> ?? [.. wired];
        var wirelessList = wireless as IList<WirelessNetworkAdapter> ?? [.. wireless];

        var pcieNeeded = wiredList
            .Where(adapter => adapter.HostInterface == WiredHostInterface.Pcie)
            .Select(adapter => adapter.PcieSlotType!.Value)
            .Concat(wirelessList
                .Where(adapter => adapter.HostInterface == WirelessHostInterface.Pcie)
                .Select(adapter => adapter.PcieSlotType!.Value))
            .GroupBy(slotType => slotType)
            .ToList();

        foreach (var group in pcieNeeded)
        {
            if (!HasCapacity(CountPcie(pcieSlots, group.Key), group.Count()))
                return PartsCompatibilityResult.Incompatible(CompatibilityReason.NotEnoughPcieSlots);
        }

        PartsCompatibilityResult? reduced = null;

        var usbNeeded = wiredList
            .Where(adapter => adapter.HostInterface == WiredHostInterface.Usb)
            .Select(adapter => (Type: adapter.UsbType!.Value, Version: adapter.UsbVersion!.Value))
            .Concat(wirelessList
                .Where(adapter => adapter.HostInterface == WirelessHostInterface.Usb)
                .Select(adapter => (Type: adapter.UsbType!.Value, Version: adapter.UsbVersion!.Value)))
            .GroupBy(usb => usb.Type)
            .ToList();

        foreach (var group in usbNeeded)
        {
            var ports = usbPorts.Where(port => port.UsbType == group.Key).ToList();
            if (!HasCapacity(CountUsb(ports, group.Key), group.Count()))
                return PartsCompatibilityResult.Incompatible(CompatibilityReason.NoMatchingUsbPort);

            var maxVersion = ports.Max(port => port.UsbVersion);
            var rated = group.Max(usb => usb.Version);
            if (rated > maxVersion)
            {
                reduced = PartsCompatibilityResult.CompatibleReduced(
                    CompatibilityReason.UsbVersionReduced,
                    rated,
                    maxVersion);
            }
        }

        var m2Result = MotherboardStorageCompatibility.AssignWireless(
            m2Slots,
            wirelessList.Where(adapter => adapter.HostInterface == WirelessHostInterface.M2));

        if (m2Result.Status == PartsCompatibility.Incompatible)
            return m2Result;

        return reduced ?? m2Result;
    }

    public static Expression<Func<WiredNetworkAdapter, bool>> WiredFilter(
        IReadOnlyCollection<MotherboardPcie> pcieSlots,
        IReadOnlyCollection<MotherboardUsb> usbPorts)
    {
        var clauses = new List<Expression<Func<WiredNetworkAdapter, bool>>>();
        foreach (var type in Enum.GetValues<PcieSlotType>())
        {
            if (!HasCapacity(CountPcie(pcieSlots, type), 1))
                continue;

            var slotType = type;
            clauses.Add(adapter =>
                adapter.HostInterface == WiredHostInterface.Pcie && adapter.PcieSlotType == slotType);
        }

        foreach (var type in Enum.GetValues<UsbType>())
        {
            if (!HasCapacity(CountUsb(usbPorts, type), 1))
                continue;

            var usbType = type;
            clauses.Add(adapter =>
                adapter.HostInterface == WiredHostInterface.Usb && adapter.UsbType == usbType);
        }

        return CompatibilityExpression.Or(clauses.ToArray());
    }

    public static Expression<Func<WirelessNetworkAdapter, bool>> WirelessFilter(
        IReadOnlyCollection<MotherboardPcie> pcieSlots,
        IReadOnlyCollection<MotherboardUsb> usbPorts,
        IReadOnlyCollection<MotherboardM2> m2Slots)
    {
        var clauses = new List<Expression<Func<WirelessNetworkAdapter, bool>>>();
        foreach (var type in Enum.GetValues<PcieSlotType>())
        {
            if (!HasCapacity(CountPcie(pcieSlots, type), 1))
                continue;

            var slotType = type;
            clauses.Add(adapter =>
                adapter.HostInterface == WirelessHostInterface.Pcie && adapter.PcieSlotType == slotType);
        }

        foreach (var type in Enum.GetValues<UsbType>())
        {
            if (!HasCapacity(CountUsb(usbPorts, type), 1))
                continue;

            var usbType = type;
            clauses.Add(adapter =>
                adapter.HostInterface == WirelessHostInterface.Usb && adapter.UsbType == usbType);
        }

        foreach (var slot in m2Slots)
        {
            foreach (var form in slot.FormFactors)
                clauses.Add(WirelessM2SlotFits(slot.Key, form.FormFactor, slot.SlotCount));
        }

        return CompatibilityExpression.Or(clauses.ToArray());
    }

    private static Expression<Func<WirelessNetworkAdapter, bool>> WirelessM2SlotFits(
        M2Key slotKey,
        M2FormFactor slotFormFactor,
        int slotCount) =>
        CompatibilityExpression.Bind(WirelessSlotAccepts, slotKey, slotFormFactor, slotCount);

    private static readonly Expression<Func<WirelessNetworkAdapter, M2Key, M2FormFactor, int, bool>> WirelessSlotAccepts =
        BuildWirelessSlotAccepts();

    private static Expression<Func<WirelessNetworkAdapter, M2Key, M2FormFactor, int, bool>> BuildWirelessSlotAccepts()
    {
        var adapter = Expression.Parameter(typeof(WirelessNetworkAdapter), "adapter");
        var slotKey = Expression.Parameter(typeof(M2Key), "slotKey");
        var slotForm = Expression.Parameter(typeof(M2FormFactor), "slotForm");
        var slotCount = Expression.Parameter(typeof(int), "slotCount");
        var key = Expression.Property(adapter, nameof(WirelessNetworkAdapter.Key));
        var form = Expression.Property(adapter, nameof(WirelessNetworkAdapter.M2FormFactor));
        var fits = CompatibilityExpression.Inline(M2KeyCompatibility.FitsExpression, key, slotKey);
        var formMatches = Expression.Equal(form, Expression.Convert(slotForm, typeof(M2FormFactor?)));
        var isM2 = Expression.Equal(
            Expression.Property(adapter, nameof(WirelessNetworkAdapter.HostInterface)),
            Expression.Constant(WirelessHostInterface.M2));
        var countOk = Expression.GreaterThan(slotCount, Expression.Constant(0));
        var body = Expression.AndAlso(isM2, Expression.AndAlso(countOk, Expression.AndAlso(fits, formMatches)));
        return Expression.Lambda<Func<WirelessNetworkAdapter, M2Key, M2FormFactor, int, bool>>(
            body,
            adapter,
            slotKey,
            slotForm,
            slotCount);
    }

    private static bool HasCapacity(int available, int needed) => available >= needed;

    private static int CountPcie(IEnumerable<MotherboardPcie> slots, PcieSlotType type) =>
        slots.Where(slot => slot.SlotType == type).Sum(slot => slot.SlotCount);

    private static int CountUsb(IEnumerable<MotherboardUsb> ports, UsbType type) =>
        ports.Where(port => port.UsbType == type).Sum(port => port.PortCount);
}
