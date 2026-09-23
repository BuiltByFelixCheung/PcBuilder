using PcBuilderBackend.Application.Catalog.Chassis.Dto;
using PcBuilderBackend.Domain.Enums;
using PcBuilderBackend.Domain.ValueObjects;

namespace PcBuilderBackend.Application.Catalog.Chassis;

public abstract record ChassisNamedFields : ChassisSpecs, IChassisFields
{
    public string Name { get; init; } = string.Empty;
    public Guid ManufacturerId { get; init; }
}

public abstract record ChassisWriteFields : ChassisNamedFields, IChassisCollections
{
    public List<ChassisFanMountDto> FanMounts { get; init; } = [];
    public List<ChassisDriveBayDto> DriveBays { get; init; } = [];
    public List<ChassisPcieSlotDto> PcieSlots { get; init; } = [];
    public List<ChassisRadiatorDto> Radiators { get; init; } = [];
    public List<PsuFormFactor> PsuFormFactors { get; init; } = [];
    public List<MbFormFactor> MbFormFactors { get; init; } = [];
}
