using PcBuilderBackend.Domain.Enums;

namespace PcBuilderBackend.Application.Catalog.ProductPictures.Dto;

public record ProductPictureDto(Guid Id, ProductType ProductType, Guid ProductId);
