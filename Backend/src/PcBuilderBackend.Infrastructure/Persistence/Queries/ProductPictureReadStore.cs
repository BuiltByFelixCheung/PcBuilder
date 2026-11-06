using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.EntityFrameworkCore;
using PcBuilderBackend.Application.Catalog.ProductPictures;
using PcBuilderBackend.Application.Catalog.ProductPictures.Dto;
using PcBuilderBackend.Domain.Enums;

namespace PcBuilderBackend.Infrastructure.Persistence.Queries;

public sealed class ProductPictureReadStore(PcBuilderDbContext db, IMapper mapper) : IProductPictureReadStore
{
    public Task<List<ProductPictureDto>> ListByProductAsync(
        ProductType productType,
        Guid productId,
        CancellationToken cancellationToken) =>
        db.ProductPictures
            .AsNoTracking()
            .Where(picture => picture.ProductType == productType && picture.ProductId == productId)
            .OrderBy(picture => picture.CreatedAtUtc)
            .ThenBy(picture => picture.Id)
            .ProjectTo<ProductPictureDto>(mapper.ConfigurationProvider)
            .ToListAsync(cancellationToken);
}
