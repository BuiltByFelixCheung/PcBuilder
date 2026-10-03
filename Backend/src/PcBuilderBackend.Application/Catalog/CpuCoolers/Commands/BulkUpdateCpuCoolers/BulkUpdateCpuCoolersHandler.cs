using AutoMapper;
using MediatR;
using Microsoft.Extensions.Logging;
using PcBuilderBackend.Application.Catalog.CpuCoolers;
using PcBuilderBackend.Application.Catalog.CpuCoolers.Dto;
using PcBuilderBackend.Application.Common.Interfaces;
using PcBuilderBackend.Application.Common.Logging;

namespace PcBuilderBackend.Application.Catalog.CpuCoolers.Commands.BulkUpdateCpuCoolers;

public class BulkUpdateCpuCoolersHandler(
    ICpuCoolerRepository cpuCoolers,
    IUnitOfWork unitOfWork,
    IMapper mapper,
    ILogger<BulkUpdateCpuCoolersHandler> logger)
    : IRequestHandler<BulkUpdateCpuCoolersCommand, List<CpuCoolerDto>?>
{
    public async Task<List<CpuCoolerDto>?> Handle(
        BulkUpdateCpuCoolersCommand request,
        CancellationToken cancellationToken)
    {
        var result = new List<CpuCoolerDto>();

        foreach (var dto in request.CpuCoolers)
        {
            var entity = await cpuCoolers.GetWithChildrenAsync(dto.Id, cancellationToken);

            if (entity is null)
            {
                EntityLog.NotFoundOrInactive(logger, EntityLog.CpuCooler, dto.Id);
                return null;
            }

            entity.Rename(dto.Name);
            entity.UpdateManufacturer(dto.ManufacturerId);
            entity.UpdateSpecs(dto.ToSpecs());

            result.Add(mapper.Map<CpuCoolerDto>(entity));
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);

        EntityLog.BulkUpdated(logger, result.Count, EntityLog.CpuCooler);

        return result;
    }
}
