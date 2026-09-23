using PcBuilderBackend.Application.Catalog.Chassis;

namespace PcBuilderBackend.Application.Catalog.Chassis.Dto;

public record ChassisImportRow : ChassisNamedFields
{
    public int RowNumber { get; init; }
    public List<ChassisDriveBayImportRow> DriveBays { get; init; } = [];
    public List<ChassisFanMountImportRow> FanMounts { get; init; } = [];
    public List<ChassisPcieSlotImportRow> PcieSlots { get; init; } = [];
    public List<ChassisRadiatorImportRow> Radiators { get; init; } = [];
    public List<ChassisMbFormFactorImportRow> MbFormFactors { get; init; } = [];
    public List<ChassisPsuFormFactorImportRow> PsuFormFactors { get; init; } = [];
}
