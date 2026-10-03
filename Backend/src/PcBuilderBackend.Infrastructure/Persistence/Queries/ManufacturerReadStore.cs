using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.EntityFrameworkCore;
using PcBuilderBackend.Application.MasterData.Manufacturers;
using PcBuilderBackend.Application.MasterData.Manufacturers.Dto;
using PcBuilderBackend.Domain.Entities;
using PcBuilderBackend.Domain.Enums;

namespace PcBuilderBackend.Infrastructure.Persistence.Queries;

public sealed class ManufacturerReadStore(PcBuilderDbContext db, IMapper mapper) : IManufacturerReadStore
{
    public Task<List<ManufacturerDto>> ListByProductTypeAsync(
        ProductType productType,
        CancellationToken cancellationToken)
    {
        var filtered = FilterByProductType(db.Manufacturers.AsNoTracking(), productType);

        return filtered
            .OrderBy(m => m.Name)
            .ProjectTo<ManufacturerDto>(mapper.ConfigurationProvider)
            .ToListAsync(cancellationToken);
    }

    internal static IQueryable<Manufacturer> FilterByProductType(
        IQueryable<Manufacturer> manufacturers,
        ProductType productType)
    {
        if (!Enum.IsDefined(productType))
            throw new ArgumentOutOfRangeException(nameof(productType), productType, null);

        return manufacturers.Where(manufacturer => manufacturer.ProductTypes.Contains(productType));
    }
}
