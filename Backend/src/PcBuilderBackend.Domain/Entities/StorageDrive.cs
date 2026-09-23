using PcBuilderBackend.Domain.Enums;
using PcBuilderBackend.Domain.ValueObjects;

namespace PcBuilderBackend.Domain.Entities;

public class StorageDrive : ProductEntity
{
    public StorageMedia Media { get; private set; }
    public StorageInterface Interface { get; private set; }
    public StorageFormFactor FormFactor { get; private set; }
    public int CapacityGb { get; private set; }
    public PcieGeneration? PcieGeneration { get; private set; }
    public int? Rpm { get; private set; }

    public bool IsM2 => IsM2Form(FormFactor);

    public M2Key? ModuleKey
    {
        get
        {
            if (!IsM2)
                return null;

            return Interface == StorageInterface.Sata ? M2Key.BM : M2Key.M;
        }
    }

    public M2FormFactor? M2FormFactor => FormFactor switch
    {
        StorageFormFactor.M22230 => PcBuilderBackend.Domain.Enums.M2FormFactor.M22230,
        StorageFormFactor.M22242 => PcBuilderBackend.Domain.Enums.M2FormFactor.M22242,
        StorageFormFactor.M22260 => PcBuilderBackend.Domain.Enums.M2FormFactor.M22260,
        StorageFormFactor.M22280 => PcBuilderBackend.Domain.Enums.M2FormFactor.M22280,
        StorageFormFactor.M222110 => PcBuilderBackend.Domain.Enums.M2FormFactor.M222110,
        _ => null
    };
    
    protected StorageDrive() {}

    public StorageDrive(string name, Guid manufacturerId, StorageDriveSpecs specs)
    {
        SetName(name);
        SetManufacturer(manufacturerId);
        SetSpecs(specs);
    }

    public void UpdateSpecs(StorageDriveSpecs specs)
    {
        SetSpecs(specs);
        UpdatedAtUtc = DateTime.UtcNow;
    }

    private void SetSpecs(StorageDriveSpecs specs)
    {
        if (specs.FormFactor == StorageFormFactor.Sata35)
            SetSata35Specs(specs.Media, specs.Interface, specs.FormFactor, specs.CapacityGb, specs.Rpm);
        else if (specs.FormFactor == StorageFormFactor.Sata25)
            SetSata25Specs(specs.Media, specs.Interface, specs.FormFactor, specs.CapacityGb, specs.Rpm);
        else if (IsM2Form(specs.FormFactor))
            SetM2Specs(specs.Media, specs.Interface, specs.FormFactor, specs.CapacityGb, specs.PcieGeneration);
        else
            throw new ArgumentException("Storage form factor is not recognized as HDD or SSD.", nameof(specs));
    }

    private static bool IsM2Form(StorageFormFactor factor) => factor is
        StorageFormFactor.M22230 or
        StorageFormFactor.M22242 or
        StorageFormFactor.M22260 or
        StorageFormFactor.M22280 or
        StorageFormFactor.M222110;

    private void SetSata35Specs(
        StorageMedia storageMedia,
        StorageInterface storageInterface,
        StorageFormFactor factor,
        int capacityGb,
        int? rpm)
    {
        if (storageMedia != StorageMedia.Hdd)
            throw new ArgumentException("Storage media must be HDD for the selected form factor.", nameof(storageMedia));

        if (!rpm.HasValue)
            throw new ArgumentException("RPM is required for HDD.", nameof(rpm));

        SetHddSpecs(storageMedia, storageInterface, factor, capacityGb, rpm.Value);
    }

    private void SetSata25Specs(
        StorageMedia storageMedia,
        StorageInterface storageInterface,
        StorageFormFactor factor,
        int capacityGb,
        int? rpm)
    {
        switch (storageMedia)
        {
            case StorageMedia.Hdd:
                if (!rpm.HasValue)
                    throw new ArgumentException("RPM is required for HDD.", nameof(rpm));

                SetHddSpecs(storageMedia, storageInterface, factor, capacityGb, rpm.Value);
                break;
            case StorageMedia.Ssd:
                SetSataSsdSpecs(storageMedia, storageInterface, factor, capacityGb);
                break;
            default:
                throw new ArgumentException("Storage media is invalid.", nameof(storageMedia));
        }
    }

    private void SetM2Specs(
        StorageMedia storageMedia,
        StorageInterface storageInterface,
        StorageFormFactor factor,
        int capacityGb,
        PcieGeneration? pcieGeneration)
    {
        if (storageMedia != StorageMedia.Ssd)
            throw new ArgumentException("Storage media must be SSD for the selected form factor.", nameof(storageMedia));

        if (!pcieGeneration.HasValue)
            throw new ArgumentException("PCIe generation is required for SSD.", nameof(pcieGeneration));

        SetSsdSpecs(storageMedia, storageInterface, factor, capacityGb, pcieGeneration.Value);
    }

    private void SetHddSpecs(StorageMedia storageMedia, StorageInterface storageInterface, StorageFormFactor factor,
        int capacityGb, int rpm)
    {
        if (!Enum.IsDefined(storageInterface))
            throw new ArgumentException("Storage Interface is invalid.");
        
        if (!Enum.IsDefined(storageMedia))
            throw new ArgumentException("Storage Media is invalid.");
        
        if (!Enum.IsDefined(factor))
            throw new ArgumentException("Storage Form Factor is invalid.");
        
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(capacityGb);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(rpm);
        
        Interface = storageInterface;
        Media = storageMedia;
        FormFactor = factor;
        CapacityGb = capacityGb;
        Rpm = rpm;
        PcieGeneration = null;
    }

    private void SetSataSsdSpecs(
        StorageMedia storageMedia,
        StorageInterface storageInterface,
        StorageFormFactor factor,
        int capacityGb)
    {
        if (storageInterface != StorageInterface.Sata)
            throw new ArgumentException("2.5\" SSD must use a SATA interface.", nameof(storageInterface));

        if (!Enum.IsDefined(storageMedia))
            throw new ArgumentException("Storage Media is invalid.");

        if (!Enum.IsDefined(factor))
            throw new ArgumentException("Storage Form Factor is invalid.");

        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(capacityGb);

        Interface = storageInterface;
        Media = storageMedia;
        FormFactor = factor;
        CapacityGb = capacityGb;
        Rpm = null;
        PcieGeneration = null;
    }

    private void SetSsdSpecs(StorageMedia storageMedia, StorageInterface storageInterface, StorageFormFactor factor,
        int capacityGb, PcieGeneration pcieGeneration)
    {
        if (!Enum.IsDefined(storageMedia))
            throw new ArgumentException("Storage Media is invalid.");
            
        if (!Enum.IsDefined(storageInterface))
            throw new ArgumentException("Storage Interface is invalid.");
        
        if (!Enum.IsDefined(factor))
            throw new ArgumentException("Storage Form Factor is invalid.");
        
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(capacityGb);
        
        if (!Enum.IsDefined(pcieGeneration))
            throw new ArgumentException("PcieGeneration is invalid.");
        
        Interface = storageInterface;
        Media = storageMedia;
        FormFactor = factor;
        CapacityGb = capacityGb;
        PcieGeneration = pcieGeneration;
        Rpm = null;
    }
}
