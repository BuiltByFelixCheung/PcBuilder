using Microsoft.Extensions.Logging;

namespace PcBuilderBackend.Application.Common.Logging;

/// <summary>
/// Source-generated structured log messages for entity commands (catalog and master data).
/// Prefer these over ILogger extension methods to avoid CA1848 / ReSharper "expensive logging".
/// </summary>
internal static partial class EntityLog
{
    // Loggable entity names for PC Builds
    public const string PcBuild = "PC Build";
    public const string PcBuildUser = "PC Build User";
    public const string PcBuildPart = "PC Build Part";

    // Loggable entity names for catalog entities
    public const string Cpu = "CPU";
    public const string GraphicsCard = "Graphics Card";
    public const string Psu = "PSU";
    public const string Motherboard = "Motherboard";
    public const string Chassis = "Chassis";
    public const string ChassisFan = "Chassis Fan";
    public const string Ram = "RAM";
    public const string CpuCooler = "CPU Cooler";
    public const string StorageDrive = "Storage Drive";
    public const string WiredNetworkAdapter = "Wired Network Adapter";
    public const string WirelessNetworkAdapter = "Wireless Network Adapter";

    // Loggable entity names for master data
    public const string Chipset = "Chipset";
    public const string CpuSeries = "CPU Series";
    public const string GpuSeries = "GPU Series";
    public const string Gpu = "GPU";
    public const string Manufacturer = "Manufacturer";
    public const string Socket = "Socket";
    public const string ProductPicture = "Product Picture";
    public const string BuildPicture = "Build Picture";

    // Logger Message for entity operations
    [LoggerMessage(
        EventId = 1001,
        Level = LogLevel.Information,
        Message = "{EntityName} {EntityId} created successfully.")]
    public static partial void Created(ILogger logger, string entityName, Guid entityId);

    [LoggerMessage(
        EventId = 1002,
        Level = LogLevel.Information,
        Message = "{EntityName} {EntityId} updated successfully.")]
    public static partial void Updated(ILogger logger, string entityName, Guid entityId);

    [LoggerMessage(
        EventId = 1003,
        Level = LogLevel.Information,
        Message = "{EntityName} {EntityId} deleted successfully.")]
    public static partial void Deleted(ILogger logger, string entityName, Guid entityId);

    [LoggerMessage(
        EventId = 1004,
        Level = LogLevel.Warning,
        Message = "{EntityName} with Id {EntityId} not found or is inactive.")]
    public static partial void NotFoundOrInactive(ILogger logger, string entityName, Guid entityId);

    [LoggerMessage(
        EventId = 1005,
        Level = LogLevel.Warning,
        Message = "{EntityName} with Id {EntityId} not found.")]
    public static partial void NotFound(ILogger logger, string entityName, Guid entityId);

    [LoggerMessage(
        EventId = 1006,
        Level = LogLevel.Warning,
        Message = "Not authorized to perform action on {EntityName} with Id {EntityId}.")]
    public static partial void NotAuthorized(ILogger logger, string entityName, Guid entityId);

    [LoggerMessage(
        EventId = 1007,
        Level = LogLevel.Information,
        Message = "Bulk created {Count} {EntityName} successfully.")]
    public static partial void BulkCreated(ILogger logger, int count, string entityName);

    [LoggerMessage(
        EventId = 1008,
        Level = LogLevel.Information,
        Message = "Bulk updated {Count} {EntityName} successfully.")]
    public static partial void BulkUpdated(ILogger logger, int count, string entityName);

    [LoggerMessage(
        EventId = 1009,
        Level = LogLevel.Information,
        Message = "Bulk deleted {Count} {EntityName} successfully.")]
    public static partial void BulkDeleted(ILogger logger, int count, string entityName);

    [LoggerMessage(
        EventId = 1010,
        Level = LogLevel.Warning,
        Message = "Bulk {Action} {EntityName} aborted: requested {RequestedCount}, found {FoundCount}.")]
    public static partial void BulkAborted(
        ILogger logger,
        string action,
        string entityName,
        int requestedCount,
        int foundCount);

    [LoggerMessage(
        EventId = 1011,
        Level = LogLevel.Information,
        Message = "Imported {Count} {EntityName} successfully.")]
    public static partial void Imported(ILogger logger, int count, string entityName);


    // Logger Message for bulk update of child collections
    [LoggerMessage(
        EventId = 1012,
        Level = LogLevel.Information,
        Message = "Bulk updated RAM compatibility entries for CPU {CpuId} successfully.")]
    public static partial void CpuRamCompatsUpdated(ILogger logger, Guid cpuId);

    [LoggerMessage(
        EventId = 1013,
        Level = LogLevel.Information,
        Message = "Bulk updated supported chipset entries for CPU {CpuId} successfully.")]
    public static partial void CpuSupportChipsetsUpdated(ILogger logger, Guid cpuId);

    [LoggerMessage(
        EventId = 1014,
        Level = LogLevel.Information,
        Message = "Bulk updated PCIe slots for motherboard {MotherboardId} successfully.")]
    public static partial void MotherboardPcieSlotsUpdated(ILogger logger, Guid motherboardId);

    [LoggerMessage(
        EventId = 1015,
        Level = LogLevel.Information,
        Message = "Bulk updated M.2 slots for motherboard {MotherboardId} successfully.")]
    public static partial void MotherboardM2SlotsUpdated(ILogger logger, Guid motherboardId);

    [LoggerMessage(
        EventId = 1016,
        Level = LogLevel.Information,
        Message = "Bulk updated USB ports for motherboard {MotherboardId} successfully.")]
    public static partial void MotherboardUsbPortsUpdated(ILogger logger, Guid motherboardId);

    [LoggerMessage(
        EventId = 1017,
        Level = LogLevel.Information,
        Message = "Bulk updated drive bays for chassis {ChassisId} successfully.")]
    public static partial void ChassisDriveBaysUpdated(ILogger logger, Guid chassisId);

    [LoggerMessage(
        EventId = 1018,
        Level = LogLevel.Information,
        Message = "Bulk updated fan mounts for chassis {ChassisId} successfully.")]
    public static partial void ChassisFanMountsUpdated(ILogger logger, Guid chassisId);

    [LoggerMessage(
        EventId = 1019,
        Level = LogLevel.Information,
        Message = "Bulk updated PCIe slots for chassis {ChassisId} successfully.")]
    public static partial void ChassisPcieSlotsUpdated(ILogger logger, Guid chassisId);

    [LoggerMessage(
        EventId = 1020,
        Level = LogLevel.Information,
        Message = "Bulk updated radiators for chassis {ChassisId} successfully.")]
    public static partial void ChassisRadiatorsUpdated(ILogger logger, Guid chassisId);

    [LoggerMessage(
        EventId = 1021,
        Level = LogLevel.Information,
        Message = "Bulk updated motherboard form factors for chassis {ChassisId} successfully.")]
    public static partial void ChassisMbFormFactorsUpdated(ILogger logger, Guid chassisId);

    [LoggerMessage(
        EventId = 1022,
        Level = LogLevel.Information,
        Message = "Bulk updated PSU form factors for chassis {ChassisId} successfully.")]
    public static partial void ChassisPsuFormFactorsUpdated(ILogger logger, Guid chassisId);

    [LoggerMessage(
        EventId = 1023,
        Level = LogLevel.Information,
        Message = "Bulk updated sockets for CPU cooler {CpuCoolerId} successfully.")]
    public static partial void CpuCoolerSocketsUpdated(ILogger logger, Guid cpuCoolerId);

    [LoggerMessage(
        EventId = 1024,
        Level = LogLevel.Information,
        Message = "Bulk updated cables for PSU {PsuId} successfully.")]
    public static partial void PsuCablesUpdated(ILogger logger, Guid psuId);

    [LoggerMessage(
        EventId = 1025,
        Level = LogLevel.Warning,
        Message = "Compatibility check failed for PcBuild {PcBuildId}.")]
    public static partial void CompatibilityCheckFailed(ILogger logger, Guid pcBuildId);

    [LoggerMessage(
        EventId = 1026,
        Level = LogLevel.Warning,
        Message = "Compatibility check failed on creation.")]
    public static partial void CompatibilityCheckFailedOnCreation(ILogger logger);

    [LoggerMessage(
        EventId = 1027,
        Level = LogLevel.Warning,
        Message = "Not authorized to perform bulk action on {EntityName}.")]
    public static partial void NotAuthorizedBulk(ILogger logger, string entityName);

    [LoggerMessage(
        EventId = 1028,
        Level = LogLevel.Error,
        Message = "Failed to remove uploaded picture {PictureKey} after the picture row could not be saved. {SaveError}")]
    public static partial void PictureCleanupFailed(
        ILogger logger,
        Exception exception,
        string pictureKey,
        string saveError);
}
