using Microsoft.EntityFrameworkCore;
using PcBuilderBackend.Application.Catalog.ProductPictures;
using PcBuilderBackend.Domain.Entities;

namespace PcBuilderBackend.Infrastructure.Persistence.Repositories;

public sealed class ProductPictureRepository(PcBuilderDbContext db) : IProductPictureRepository
{
    public Task<ProductPicture?> GetByIdAsync(Guid id, CancellationToken cancellationToken) =>
        db.ProductPictures.FirstOrDefaultAsync(picture => picture.Id == id, cancellationToken);

    public void Add(ProductPicture picture) => db.ProductPictures.Add(picture);
}
