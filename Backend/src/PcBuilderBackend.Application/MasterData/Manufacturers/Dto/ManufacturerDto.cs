using PcBuilderBackend.Domain.Enums;

namespace PcBuilderBackend.Application.MasterData.Manufacturers.Dto;

public record ManufacturerDto(System.Guid Id, string Name, List<ProductType>? ProductTypes = null);
