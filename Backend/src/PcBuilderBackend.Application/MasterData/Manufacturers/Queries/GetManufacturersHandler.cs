using MediatR;
using PcBuilderBackend.Application.Common.Caching;
using PcBuilderBackend.Application.Common.Interfaces;
using PcBuilderBackend.Application.MasterData.Manufacturers.Dto;

namespace PcBuilderBackend.Application.MasterData.Manufacturers.Queries;

public class GetManufacturersHandler(IReadStore<ManufacturerDto> store, ICacheService cache)
    : IRequestHandler<GetManufacturersQuery, List<ManufacturerDto>>
{
    public Task<List<ManufacturerDto>> Handle(GetManufacturersQuery request, CancellationToken cancellationToken)
    {
        return cache.GetOrSetAsync(
            MasterDataCacheKeys.Manufacturers.All(),
            async ct =>
            {
                var entities = await store.ListAsync(ct);
                return entities;
            },
            MasterDataCacheKeys.DefaultTtl,
            cancellationToken);
    }
}
