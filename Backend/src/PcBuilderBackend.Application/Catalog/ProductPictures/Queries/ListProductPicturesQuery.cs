using MediatR;
using PcBuilderBackend.Application.Catalog.ProductPictures.Dto;
using PcBuilderBackend.Domain.Enums;

namespace PcBuilderBackend.Application.Catalog.ProductPictures.Queries;

public record ListProductPicturesQuery(ProductType ProductType, Guid ProductId)
    : IRequest<List<ProductPictureDto>>;
