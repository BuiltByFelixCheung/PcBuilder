using PcBuilderBackend.Domain.Enums;
using PcBuilderBackend.Domain.ValueObjects;

namespace PcBuilderBackend.Domain.Entities;

public class GraphicsCard : ProductEntity
{
    public Guid GpuId { get; private set; }
    public int VideoMemoryGb { get; private set; }
    public int PcieSlotsUsed { get; private set; }
    public PcieGeneration PcieGeneration { get; private set; }
    public bool IsLowProfile { get; private set; }
    public decimal LengthMm { get; private set; }
    public decimal WidthMm { get; private set; }
    public decimal HeightMm { get; private set; }
    public int PowerConsumptionWatts { get; private set; }
    public Gpu Gpu { get; private set; } = null!;
    public PsuCableType PowerConnectorType { get; private set; }
    public int PowerConnectorCount { get; private set; }

    protected GraphicsCard()
    {
    }

    public GraphicsCard(string name, Guid manufacturerId, GraphicsCardSpecs specs)
    {
        SetName(name);
        SetManufacturer(manufacturerId);
        SetSpecs(specs);
    }

    public void UpdateSpecs(GraphicsCardSpecs specs)
    {
        SetSpecs(specs);
        UpdatedAtUtc = DateTime.UtcNow;
    }

    private void SetSpecs(GraphicsCardSpecs specs)
    {
        if (specs.GpuId == Guid.Empty)
            throw new ArgumentException("Gpu id can't be empty");

        if (specs.VideoMemoryGb <= 0)
            throw new ArgumentException("Video memory GB must be greater than zero");

        if (specs.PcieSlotsUsed <= 0)
            throw new ArgumentException("PcieSlotsUsed must be greater than zero");

        if (!Enum.IsDefined(specs.PcieGeneration))
            throw new ArgumentException("PcieGeneration must be a valid value");

        if (specs.LengthMm <= 0)
            throw new ArgumentException("Length mm must be greater than zero");

        if (specs.WidthMm <= 0)
            throw new ArgumentException("Width mm must be greater than zero");

        if (specs.HeightMm <= 0)
            throw new ArgumentException("Height mm must be greater than zero");

        if (specs.PowerConsumptionWatts <= 0)
            throw new ArgumentException("PowerConsumptionWatts must be greater than zero");

        if (!Enum.IsDefined(specs.PowerConnectorType))
            throw new ArgumentException("PowerConnectorType must be a valid value");

        if (specs.PowerConnectorType == PsuCableType.None)
        {
            if (specs.PowerConnectorCount != 0)
                throw new ArgumentException("PowerConnectorCount must be zero when no external power connector is required");
        }
        else if (specs.PowerConnectorCount <= 0)
        {
            throw new ArgumentException("PowerConnectorCount must be greater than zero");
        }

        GpuId = specs.GpuId;
        VideoMemoryGb = specs.VideoMemoryGb;
        PcieSlotsUsed = specs.PcieSlotsUsed;
        PcieGeneration = specs.PcieGeneration;
        LengthMm = specs.LengthMm;
        WidthMm = specs.WidthMm;
        HeightMm = specs.HeightMm;
        IsLowProfile = specs.IsLowProfile;
        PowerConsumptionWatts = specs.PowerConsumptionWatts;
        PowerConnectorType = specs.PowerConnectorType;
        PowerConnectorCount = specs.PowerConnectorCount;
    }
}
