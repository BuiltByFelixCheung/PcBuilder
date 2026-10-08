using PcBuilderBackend.Domain.Compatibility;
using PcBuilderBackend.Domain.Enums;
using PcBuilderBackend.Domain.ValueObjects;

namespace PcBuilderBackend.Domain.Entities;

public class Psu : ProductEntity
{
    public int Wattage { get; private set; }
    public PsuModularity Modularity { get; private set; }
    public PsuFormFactor FormFactor { get; private set; }
    public decimal LengthMm { get; private set; }
    public decimal WidthMm { get; private set; }
    public decimal HeightMm { get; private set; }

    private readonly List<PsuCable> _cables = [];
    public IReadOnlyCollection<PsuCable> Cables => _cables;
    
    protected Psu() {}

    public Psu(string name, Guid manufacturerId, PsuSpecs specs)
    {
        SetName(name);
        SetManufacturer(manufacturerId);
        SetSpecs(specs);
    }

    public void UpdateSpecs(PsuSpecs specs)
    {
        SetSpecs(specs);
        UpdatedAtUtc = DateTime.UtcNow;
    }

    public void AddCable(PsuCable cable)
    {
        if (_cables.Any(c => c.PsuId == cable.PsuId && c.Type == cable.Type))
            throw new ArgumentException("Cable is already added");
            
        _cables.Add(cable);
    }

    public void RemoveCable(PsuCable cable)
    {
        if (!_cables.Any(c => c.PsuId == cable.PsuId && c.Type == cable.Type))
            throw new ArgumentException("Cable does not exist");
        
        _cables.Remove(cable);
    }
    
    public PartsCompatibilityResult CheckPowerBudget(Cpu cpu, GraphicsCard? gpu) =>
        PsuPowerBudgetCompatibility.Evaluate(this, cpu, gpu);

    public PartsCompatibilityResult CheckMotherboardCompatibility(Motherboard motherboard) =>
        PsuMotherboardCompatibility.Evaluate(this, motherboard);

    public PartsCompatibilityResult CheckGraphicsCardCompatibility(GraphicsCard gpu) =>
        PsuGraphicsCardCompatibility.Evaluate(this, gpu);

    public PartsCompatibilityResult CheckStorageCompatibility(StorageDrive storageDrive)
    {
        return CheckStorageCompatibility([storageDrive]);
    }

    public PartsCompatibilityResult CheckStorageCompatibility(List<StorageDrive> storageDrives) =>
        PsuStorageCompatibility.Evaluate(this, storageDrives);

    private void SetSpecs(PsuSpecs specs)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(specs.Wattage);

        if (!Enum.IsDefined(specs.Modularity))
            throw new ArgumentException("Modularity is invalid  ");

        if (!Enum.IsDefined(specs.FormFactor))
            throw new ArgumentException("Form factor is invalid");

        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(specs.LengthMm);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(specs.WidthMm);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(specs.HeightMm);

        Wattage = specs.Wattage;
        Modularity = specs.Modularity;
        FormFactor = specs.FormFactor;
        LengthMm = specs.LengthMm;
        WidthMm = specs.WidthMm;
        HeightMm = specs.HeightMm;
    }
}
