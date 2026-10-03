using PcBuilderBackend.Domain.Enums;

namespace PcBuilderBackend.Domain.Entities;

public class Manufacturer : BaseEntity
{
    protected Manufacturer()
    {
    }

    public Manufacturer(string name)
    {
        SetName(name);
    }

    public string Name { get; private set; } = string.Empty;

    public List<ProductType> ProductTypes { get; private set; } = [];

    private readonly List<Socket> _sockets = [];
    public IReadOnlyCollection<Socket> Sockets => _sockets;

    private readonly List<Chipset> _chipsets = [];
    public IReadOnlyCollection<Chipset> Chipsets => _chipsets;
    
    private readonly List<Gpu> _gpus = [];
    public IReadOnlyCollection<Gpu> Gpus => _gpus;

    private readonly List<Cpu> _cpus = [];
    public IReadOnlyCollection<Cpu> Cpus => _cpus;

    private readonly List<Ram> _rams = [];
    public IReadOnlyCollection<Ram> Rams => _rams;

    private readonly List<GraphicsCard> _graphicsCards = [];
    public IReadOnlyCollection<GraphicsCard> GraphicsCards => _graphicsCards;

    private readonly List<Motherboard> _motherboards = [];
    public IReadOnlyCollection<Motherboard> Motherboards => _motherboards;

    private readonly List<Psu> _psus = [];
    public IReadOnlyCollection<Psu> Psus => _psus;

    private readonly List<Chassis> _chassis = [];
    public IReadOnlyCollection<Chassis> Chassis => _chassis;

    private readonly List<StorageDrive> _storageDrives = [];
    public IReadOnlyCollection<StorageDrive> StorageDrives => _storageDrives;

    private readonly List<CpuCooler> _cpuCoolers = [];
    public IReadOnlyCollection<CpuCooler> CpuCoolers => _cpuCoolers;

    private readonly List<CpuSeries> _cpuSeries = [];
    public IReadOnlyCollection<CpuSeries> CpuSeries => _cpuSeries;

    private readonly List<GpuSeries> _gpuSeries = [];
    public IReadOnlyCollection<GpuSeries> GpuSeries => _gpuSeries;

    private readonly List<WiredNetworkAdapter> _wiredNetworkAdapters = [];
    public IReadOnlyCollection<WiredNetworkAdapter> WiredNetworkAdapters => _wiredNetworkAdapters;

    private readonly List<WirelessNetworkAdapter> _wirelessNetworkAdapters = [];
    public IReadOnlyCollection<WirelessNetworkAdapter> WirelessNetworkAdapters => _wirelessNetworkAdapters;

    private readonly List<ChassisFan> _chassisFans = [];
    public IReadOnlyCollection<ChassisFan> ChassisFans => _chassisFans;

    public void Rename(string name)
    {
        SetName(name);
        UpdatedAtUtc = DateTime.UtcNow;
    }

    public void SetProductTypes(IEnumerable<ProductType> productTypes)
    {
        ArgumentNullException.ThrowIfNull(productTypes);

        var values = productTypes.Distinct().ToList();
        if (values.Exists(type => !Enum.IsDefined(type)))
            throw new ArgumentException("Product type is invalid.", nameof(productTypes));

        values.Sort();
        ProductTypes = values;
        UpdatedAtUtc = DateTime.UtcNow;
    }

    private void SetName(string name)
    {
        if (string.IsNullOrEmpty(name))
            throw new ArgumentException("Manufacturer name is required.", nameof(name));

        var trimmed = name.Trim();
        if (trimmed.Length > 200)
            throw new ArgumentException("Manufacturer name must be 200 characters or fewer.", nameof(name));

        Name = trimmed;
    }
}
