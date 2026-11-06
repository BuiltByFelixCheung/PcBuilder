using PcBuilderBackend.Domain.Entities;

namespace PcBuilderBackend.Application.Catalog.ProductPictures;

public interface IProductPictureRepository
{
    Task<ProductPicture?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
    void Add(ProductPicture picture);
}
