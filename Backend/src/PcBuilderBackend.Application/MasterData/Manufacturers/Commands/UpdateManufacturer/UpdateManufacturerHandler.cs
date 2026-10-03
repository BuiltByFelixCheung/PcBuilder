using AutoMapper;
using MediatR;
using Microsoft.Extensions.Logging;
using PcBuilderBackend.Application.Common.Caching;
using PcBuilderBackend.Application.Common.Interfaces;
using PcBuilderBackend.Application.Common.Logging;
using PcBuilderBackend.Application.MasterData.Manufacturers.Dto;
using PcBuilderBackend.Domain.Entities;

namespace PcBuilderBackend.Application.MasterData.Manufacturers.Commands.UpdateManufacturer;

public class UpdateManufacturerHandler(
    IRepository<Manufacturer> manufacturers,
    ILogger<UpdateManufacturerHandler> logger,
    IMapper mapper,
    IUnitOfWork unitOfWork,
    ICacheService cache)
    : IRequestHandler<UpdateManufacturerCommand, ManufacturerDto?>
{
    public async Task<ManufacturerDto?> Handle(UpdateManufacturerCommand request, CancellationToken cancellationToken)
    {
        var entity = await manufacturers.GetByIdAsync(request.Id, cancellationToken);
        if (entity == null || !entity.IsActive) return null;

        entity.Rename(request.Name);
        if (request.ProductTypes is not null)
            entity.SetProductTypes(request.ProductTypes);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        EntityLog.Updated(logger, EntityLog.Manufacturer, entity.Id);
        await cache.RemoveByPrefixAsync(MasterDataCacheKeys.Manufacturers.Prefix, cancellationToken);

        return mapper.Map<ManufacturerDto>(entity);
    }
}
