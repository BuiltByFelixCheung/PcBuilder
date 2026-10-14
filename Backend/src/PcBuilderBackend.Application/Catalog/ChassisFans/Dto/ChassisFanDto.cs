using PcBuilderBackend.Domain.Enums;

namespace PcBuilderBackend.Application.Catalog.ChassisFans.Dto;

public record ChassisFanDto(
    Guid Id,
    string Name,
    Guid ManufacturerId,
    string ManufacturerName,
    FanDiameterMm DiameterMm,
    int FansCountPerPack,
    decimal ThicknessMm,
    FanHeaderType HeaderType,
    bool SupportsDaisyChain,
    int? MaxFansPerDaisyChain
);
