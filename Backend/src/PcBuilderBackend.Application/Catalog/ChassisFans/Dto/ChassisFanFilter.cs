using PcBuilderBackend.Domain.Enums;

namespace PcBuilderBackend.Application.Catalog.ChassisFans.Dto;

public record ChassisFanFilter(
    string? Name = null,
    Guid? ManufacturerId = null,
    FanDiameterMm? DiameterMm = null,
    int? FansCountPerPack = null,
    FanHeaderType? HeaderType = null,
    bool? SupportsDaisyChain = null,
    Guid? ChassisId = null
);
