using AutoMapper;
using MediatR;
using Microsoft.Extensions.Logging;
using PcBuilderBackend.Application.Common.Caching;
using PcBuilderBackend.Application.Common.Interfaces;
using PcBuilderBackend.Application.Common.Logging;
using PcBuilderBackend.Application.MasterData.Manufacturers.Dto;
using PcBuilderBackend.Domain.Entities;

namespace PcBuilderBackend.Application.MasterData.Manufacturers.Commands.BulkUpdateManufacturers;

public class BulkUpdateManufacturersHandler(
    IRepository<Manufacturer> manufacturers,
    ILogger<BulkUpdateManufacturersHandler> logger,
    IUnitOfWork unitOfWork,
    IMapper mapper,
    ICacheService cache)
    : IRequestHandler<BulkUpdateManufacturersCommand, List<ManufacturerDto>?>
{
    public async Task<List<ManufacturerDto>?> Handle(BulkUpdateManufacturersCommand request, CancellationToken cancellationToken)
    {
        var result = new List<ManufacturerDto>();

        var ids = request.Manufacturers.Select(dto => dto.Id).ToList();
        var entities = await manufacturers.GetByIdsAsync(ids, cancellationToken);

        if (entities.Count != ids.Count)
        {
            EntityLog.BulkAborted(logger, "Update", EntityLog.Manufacturer, ids.Count, entities.Count);
            return null;
        }

        foreach (var entity in entities)
        {
            var dto = request.Manufacturers.First(dto => dto.Id == entity.Id);
            entity.Rename(dto.Name);
            if (dto.ProductTypes is not null)
                entity.SetProductTypes(dto.ProductTypes);
            result.Add(mapper.Map<ManufacturerDto>(entity));
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);
        EntityLog.BulkUpdated(logger, result.Count, EntityLog.Manufacturer);
        await cache.RemoveByPrefixAsync(MasterDataCacheKeys.Manufacturers.Prefix, cancellationToken);
        return result;
    }
}
