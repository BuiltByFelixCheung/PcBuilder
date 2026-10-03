using AutoMapper;
using MediatR;
using Microsoft.Extensions.Logging;
using PcBuilderBackend.Application.Catalog.ChassisFans.Dto;
using PcBuilderBackend.Application.Common.Interfaces;
using PcBuilderBackend.Application.Common.Logging;

namespace PcBuilderBackend.Application.Catalog.ChassisFans.Commands.BulkUpdateChassisFans;

public class BulkUpdateChassisFansHandler(
    IChassisFanRepository chassisFans,
    IUnitOfWork unitOfWork,
    IMapper mapper,
    ILogger<BulkUpdateChassisFansHandler> logger)
    : IRequestHandler<BulkUpdateChassisFansCommand, List<ChassisFanDto>?>
{
    public async Task<List<ChassisFanDto>?> Handle(
        BulkUpdateChassisFansCommand request,
        CancellationToken cancellationToken)
    {
        var result = new List<ChassisFanDto>();

        foreach (var item in request.Fans)
        {
            var entity = await chassisFans.GetByIdAsync(item.Id, cancellationToken);

            if (entity is null)
            {
                EntityLog.NotFoundOrInactive(logger, EntityLog.ChassisFan, item.Id);
                return null;
            }

            entity.Rename(item.Name);
            entity.UpdateManufacturer(item.ManufacturerId);
            entity.UpdateSpecs(item.DiameterMm, item.FansCountPerPack);

            result.Add(mapper.Map<ChassisFanDto>(entity));
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);
        EntityLog.BulkUpdated(logger, result.Count, EntityLog.ChassisFan);
        return result;
    }
}
