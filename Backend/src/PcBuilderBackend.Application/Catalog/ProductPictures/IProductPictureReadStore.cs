using PcBuilderBackend.Application.Catalog.ProductPictures.Dto;
using PcBuilderBackend.Domain.Enums;

namespace PcBuilderBackend.Application.Catalog.ProductPictures;

public interface IProductPictureReadStore
{
    Task<List<ProductPictureDto>> ListByProductAsync(
        ProductType productType,
        Guid productId,
        CancellationToken cancellationToken);
}
