using PcBuilderBackend.Domain.Enums;

namespace PcBuilderBackend.Application.Catalog.Chassis.Dto;

public class ChassisRadiatorImportRow
{
    public int ParentRowNumber { get; init; }
    public RadiatorClass Length { get; init; }
    public RadiatorMountLocation Location { get; init; }
    public int RadiatorCount { get; init; }
}
