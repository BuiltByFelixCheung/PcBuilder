using AutoMapper;
using MediatR;
using Microsoft.Extensions.Logging;
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
            entity.UpdateSpecs(
                dto.Type,
                dto.CoolerHeightMm,
                dto.MaxRamHeightMm,
                dto.RadiatorClass,
                dto.RadiatorLengthMm,
                dto.RadiatorWidthMm,
                dto.RadiatorHeightMm,
                dto.CoolerLengthMm,
                dto.CoolerWidthMm,
                dto.WaterBlockLengthMm,
                dto.WaterBlockWidthMm,
                dto.WaterBlockHeightMm,
                dto.FanThicknessMm,
                dto.FanWidthMm,
                dto.FanHeightMm,
                dto.FanCount);

            result.Add(mapper.Map<CpuCoolerDto>(entity));
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);

        EntityLog.BulkUpdated(logger, result.Count, EntityLog.CpuCooler);

        return result;
    }
}
