using PcBuilderBackend.Domain.Enums;

namespace PcBuilderBackend.Application.Catalog.Chassis.Dto;

public record ChassisRadiatorDto
{
    public RadiatorClass Length { get; init; }
    public RadiatorMountLocation Location { get; init; }
    public int RadiatorCount { get; init; }
}