using PcBuilderBackend.Domain.Enums;

namespace PcBuilderBackend.Application.Catalog.ProductPictures;

public interface IProductExistenceLookup
{
    Task<bool> ExistsAsync(
        ProductType productType,
        Guid productId,
        CancellationToken cancellationToken);
}
