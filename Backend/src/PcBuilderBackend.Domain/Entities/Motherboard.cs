using PcBuilderBackend.Domain.Compatibility;
using PcBuilderBackend.Domain.Enums;
using PcBuilderBackend.Domain.ValueObjects;

namespace PcBuilderBackend.Domain.Entities;

public class Motherboard : ProductEntity
{
    public Guid SocketId { get; private set; }
    public Guid ChipsetId { get; private set; }
    public int RamSlots { get; private set; }
    public int MaxMemoryGb { get; private set; }
    public int MaxDimmSizeGb { get; private set; }
    public int SataPorts { get; private set; }
    public int FanConnectors { get; private set; }
    public int EpsConnectors { get; private set; }
    public decimal WidthMm { get; private set; }
    public decimal HeightMm { get; private set; }
    public DdrGeneration DdrGeneration { get; private set; }
    public RamFormFactor RamFormFactor { get; private set; }
    public MbFormFactor FormFactor { get; private set; }
    public bool WifiEnabled { get; private set; }
    public bool BluetoothEnabled { get; private set; }
    public Chipset Chipset { get; private set; } = null!;
    public Socket Socket { get; private set; } = null!;

    private readonly List<MotherboardPcie> _pcieSlots = [];
    public IReadOnlyCollection<MotherboardPcie> PcieSlots => _pcieSlots.AsReadOnly();

    private readonly List<MotherboardM2> _m2Slots = [];
    public IReadOnlyCollection<MotherboardM2> M2Slots => _m2Slots.AsReadOnly();

    private readonly List<MotherboardUsb> _usbPorts = [];
    public IReadOnlyCollection<MotherboardUsb> UsbPorts => _usbPorts.AsReadOnly();

    protected Motherboard()
    {
    }

    public void AddPcieSlot(MotherboardPcie pcieSlot)
    {
        if (_pcieSlots.Any(x =>
                x.SlotType == pcieSlot.SlotType && x.SlotLanes == pcieSlot.SlotLanes &&
                x.Generation == pcieSlot.Generation))
            throw new ArgumentException("PCIe slot already exists.");

        _pcieSlots.Add(pcieSlot);
    }

    public void RemovePcieSlot(MotherboardPcie pcieSlot)
    {
        if (!_pcieSlots.Any(x =>
                x.SlotType == pcieSlot.SlotType && x.SlotLanes == pcieSlot.SlotLanes &&
                x.Generation == pcieSlot.Generation))
            throw new ArgumentException("PCIe slot does not exist.");

        _pcieSlots.Remove(pcieSlot);
    }

    public void AddM2Slot(MotherboardM2 m2Slot)
    {
        if (_m2Slots.Any(x => x.IsSameSlotGroup(m2Slot)))
            throw new ArgumentException("M.2 slot already exists.");

        _m2Slots.Add(m2Slot);
    }

    public void RemoveM2Slot(MotherboardM2 m2Slot)
    {
        if (_m2Slots.All(x => !x.IsSameSlotGroup(m2Slot)))
            throw new ArgumentException("M.2 slot does not exist.");

        _m2Slots.Remove(m2Slot);
    }

    public void AddUsbPort(MotherboardUsb usbPort)
    {
        if (_usbPorts.Any(x => x.UsbType == usbPort.UsbType && x.UsbVersion == usbPort.UsbVersion))
            throw new ArgumentException("USB port already exists.");

        _usbPorts.Add(usbPort);
    }

    public void RemoveUsbPort(MotherboardUsb usbPort)
    {
        if (_usbPorts.All(x => x.UsbType != usbPort.UsbType || x.UsbVersion != usbPort.UsbVersion))
            throw new ArgumentException("USB port does not exist.");

        _usbPorts.Remove(usbPort);
    }

    public bool CheckMemoryCompatibility(Ram memory) =>
        MotherboardMemoryCompatibility.Matches(this, memory);

    public PartsCompatibilityResult CheckCpuCompatibility(Cpu cpu) =>
        MotherboardCpuCompatibility.Evaluate(SocketId, ChipsetId, cpu);

    public PartsCompatibilityResult CheckGraphicsCardCompatibility(GraphicsCard graphicsCard) =>
        MotherboardGraphicsCompatibility.Evaluate(_pcieSlots, graphicsCard);

    public PartsCompatibilityResult CheckStorageCompatibility(StorageDrive storage)
    {
        ArgumentNullException.ThrowIfNull(storage);
        return CheckStorageCompatibility([storage]);
    }

    /// <param name="drives">
    /// Selected drives (one entry per unit; expand quantity by repeating the product).
    /// 2.5" and 3.5" SATA drives consume <see cref="SataPorts"/>. M.2 drives consume
    /// matching M.2 <see cref="MotherboardM2.SlotCount"/>.
    /// </param>
    public PartsCompatibilityResult CheckStorageCompatibility(IEnumerable<StorageDrive> drives)
    {
        ArgumentNullException.ThrowIfNull(drives);
        return MotherboardStorageCompatibility.Evaluate(SataPorts, _m2Slots, drives);
    }

    public PartsCompatibilityResult CheckWirelessNetworkAdapterCompatibility(WirelessNetworkAdapter adapter)
    {
        ArgumentNullException.ThrowIfNull(adapter);
        return CheckNetworkAdapterCompatibility([], [adapter]);
    }

    public PartsCompatibilityResult CheckWirelessNetworkAdapterCompatibility(
        IEnumerable<WirelessNetworkAdapter> adapters)
    {
        ArgumentNullException.ThrowIfNull(adapters);
        return CheckNetworkAdapterCompatibility([], adapters);
    }

    public PartsCompatibilityResult CheckWiredNetworkAdapterCompatibility(WiredNetworkAdapter adapter)
    {
        ArgumentNullException.ThrowIfNull(adapter);
        return CheckNetworkAdapterCompatibility([adapter], []);
    }

    public PartsCompatibilityResult CheckWiredNetworkAdapterCompatibility(
        IEnumerable<WiredNetworkAdapter> adapters)
    {
        ArgumentNullException.ThrowIfNull(adapters);
        return CheckNetworkAdapterCompatibility(adapters, []);
    }

    /// <param name="wired">
    /// Selected wired adapters (one entry per unit; expand quantity by repeating the product).
    /// </param>
    /// <param name="wireless">
    /// Selected wireless adapters (one entry per unit; expand quantity by repeating the product).
    /// USB ports, PCIe slots, and E-key M.2 slots are consumed in aggregate across both lists.
    /// </param>
    public PartsCompatibilityResult CheckNetworkAdapterCompatibility(
        IEnumerable<WiredNetworkAdapter> wired,
        IEnumerable<WirelessNetworkAdapter> wireless)
    {
        ArgumentNullException.ThrowIfNull(wired);
        ArgumentNullException.ThrowIfNull(wireless);
        return NetworkAdapterCompatibility.Evaluate(_pcieSlots, _usbPorts, _m2Slots, wired, wireless);
    }

    public Motherboard(Guid manufacturerId, string name, MotherboardSpecs specs)
    {
        SetName(name);
        SetManufacturer(manufacturerId);
        SetSpecs(specs);
    }

    public void UpdateSpecs(MotherboardSpecs specs)
    {
        SetSpecs(specs);
        UpdatedAtUtc = DateTime.UtcNow;
    }

    private void SetSpecs(MotherboardSpecs specs)
    {
        if (specs.SocketId == Guid.Empty)
            throw new ArgumentException("Socket ID cannot be empty");

        if (specs.ChipsetId == Guid.Empty)
            throw new ArgumentException("Chipset ID cannot be empty");

        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(specs.RamSlots);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(specs.MaxDimmSizeGb);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(specs.MaxMemoryGb);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(specs.SataPorts);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(specs.FanConnectors);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(specs.EpsConnectors);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(specs.WidthMm);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(specs.HeightMm);

        if (!Enum.IsDefined(specs.DdrGeneration))
            throw new ArgumentException("DDR Generation is invalid");

        if (!Enum.IsDefined(specs.MbFormFactor))
            throw new ArgumentException("Motherboard Form Factor is invalid");

        if (!Enum.IsDefined(specs.RamFormFactor))
            throw new ArgumentException("RAM Form Factor is invalid");

        SocketId = specs.SocketId;
        ChipsetId = specs.ChipsetId;
        RamSlots = specs.RamSlots;
        MaxMemoryGb = specs.MaxMemoryGb;
        MaxDimmSizeGb = specs.MaxDimmSizeGb;
        SataPorts = specs.SataPorts;
        FanConnectors = specs.FanConnectors;
        EpsConnectors = specs.EpsConnectors;
        DdrGeneration = specs.DdrGeneration;
        RamFormFactor = specs.RamFormFactor;
        FormFactor = specs.MbFormFactor;
        WidthMm = specs.WidthMm;
        HeightMm = specs.HeightMm;
        WifiEnabled = specs.WifiEnabled;
        BluetoothEnabled = specs.BluetoothEnabled;
    }
}
