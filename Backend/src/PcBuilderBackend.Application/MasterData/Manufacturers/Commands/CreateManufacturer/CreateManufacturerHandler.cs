using AutoMapper;
using MediatR;
using Microsoft.Extensions.Logging;
using PcBuilderBackend.Application.Common.Caching;
using PcBuilderBackend.Application.Common.Interfaces;
using PcBuilderBackend.Application.Common.Logging;
using PcBuilderBackend.Application.MasterData.Manufacturers.Dto;
using PcBuilderBackend.Domain.Entities;

namespace PcBuilderBackend.Application.MasterData.Manufacturers.Commands.CreateManufacturer;

public class CreateManufacturerHandler(
    IRepository<Manufacturer> manufacturers,
    ILogger<CreateManufacturerHandler> logger,
    IUnitOfWork unitOfWork,
    IMapper mapper, 
    ICacheService cache)
    : IRequestHandler<CreateManufacturerCommand, ManufacturerDto>
{
    public async Task<ManufacturerDto> Handle(CreateManufacturerCommand request, CancellationToken cancellationToken)
    {
        var entity = new Manufacturer(request.Name);
        entity.SetProductTypes(request.ProductTypes ?? []);
        manufacturers.Add(entity);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        EntityLog.Created(logger, EntityLog.Manufacturer, entity.Id);
        await cache.RemoveByPrefixAsync(MasterDataCacheKeys.Manufacturers.Prefix, cancellationToken);
        return mapper.Map<ManufacturerDto>(entity);
    }
}
