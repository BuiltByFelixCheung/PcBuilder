using PcBuilderBackend.Domain.Enums;

namespace PcBuilderBackend.Application.Catalog.Chassis.Dto;

public record ChassisDriveBayDto(DriveBayFormFactor[] FormFactors, int SlotCount);
