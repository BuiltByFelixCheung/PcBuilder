namespace PcBuilderBackend.Domain.Enums;

public enum CompatibilityReason
{
    None = 0,
    SocketMismatch,
    ChipsetNotSupported,
    RequiresBiosUpdate,
    RequiresIntegratedGraphics,
    NoMatchingRamConfig,
    MemorySpeedExceedsCpuSupport,
    NotEnoughPcieSlots,
    PcieGenerationReduced,
    ExceedsPowerBudget,
    InsufficientCpuPowerCables,
    MissingMotherboardPowerCable,
    InsufficientPciePowerCables,
    MissingCpuCoolerSocket,
    ExceedsThermalDesignPower,
    RamHeightExceedsCoolerLimit,
    InsufficientSataCables,
    NoMatchingM2Slot,
    SlotDoesNotSupportSata,
    InsufficientSataPorts,
    InsufficientFanHeaders,
    NoMatchingUsbPort,
    UsbVersionReduced,
    PartSizeExceedsLimits,
    CpuCoolerRequired
}