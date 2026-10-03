using AutoMapper;
using MediatR;
using Microsoft.Extensions.Logging;
using PcBuilderBackend.Application.Catalog.CpuCoolers;
using PcBuilderBackend.Application.Catalog.CpuCoolers.Dto;
using PcBuilderBackend.Application.Common.Interfaces;
using PcBuilderBackend.Application.Common.Logging;

namespace PcBuilderBackend.Application.Catalog.CpuCoolers.Commands.UpdateCpuCooler;

public class UpdateCpuCoolerHandler(
    ICpuCoolerRepository cpuCoolers,
    IUnitOfWork unitOfWork,
    IMapper mapper,
    ILogger<UpdateCpuCoolerHandler> logger)
    : IRequestHandler<UpdateCpuCoolerCommand, CpuCoolerDto?>
{
    public async Task<CpuCoolerDto?> Handle(UpdateCpuCoolerCommand request, CancellationToken cancellationToken)
    {
        var entity = await cpuCoolers.GetByIdAsync(request.Id, cancellationToken);

        if (entity is null)
        {
            EntityLog.NotFoundOrInactive(logger, EntityLog.CpuCooler, request.Id);
            return null;
        }

        entity.Rename(request.Name);
        entity.UpdateManufacturer(request.ManufacturerId);
        entity.UpdateSpecs(request.ToSpecs());

        await unitOfWork.SaveChangesAsync(cancellationToken);

        EntityLog.Updated(logger, EntityLog.CpuCooler, entity.Id);

        return mapper.Map<CpuCoolerDto>(entity);
    }
}
