using PcBuilderBackend.Domain.Enums;

namespace PcBuilderBackend.Application.Catalog.Chassis.Dto;

public class ChassisDriveBayImportRow
{
    public int ParentRowNumber { get; init; }
    public DriveBayFormFactor[] FormFactors { get; init; } = [];
    public int SlotCount { get; init; }
}
