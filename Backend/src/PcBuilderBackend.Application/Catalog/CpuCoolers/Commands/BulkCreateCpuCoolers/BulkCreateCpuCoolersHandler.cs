using AutoMapper;
using MediatR;
using Microsoft.Extensions.Logging;
using PcBuilderBackend.Application.Catalog.CpuCoolers.Commands.CreateCpuCooler;
using PcBuilderBackend.Application.Catalog.CpuCoolers.Dto;
using PcBuilderBackend.Application.Common.Interfaces;
using PcBuilderBackend.Application.Common.Logging;
using PcBuilderBackend.Domain.Entities;

namespace PcBuilderBackend.Application.Catalog.CpuCoolers.Commands.BulkCreateCpuCoolers;

public class BulkCreateCpuCoolersHandler(
    ICpuCoolerRepository cpuCoolers,
    IUnitOfWork unitOfWork,
    IMapper mapper,
    ILogger<BulkCreateCpuCoolersHandler> logger)
    : IRequestHandler<BulkCreateCpuCoolersCommand, List<CpuCoolerDto>>
{
    public async Task<List<CpuCoolerDto>> Handle(
        BulkCreateCpuCoolersCommand request,
        CancellationToken cancellationToken)
    {
        var result = new List<CpuCoolerDto>();

        foreach (var dto in request.CpuCoolers)
        {
            var entity = new CpuCooler(
                dto.ManufacturerId,
                dto.Name,
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

            CreateCpuCoolerHandler.ApplySockets(entity, dto.Sockets);

            cpuCoolers.Add(entity);
            result.Add(mapper.Map<CpuCoolerDto>(entity));
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);

        EntityLog.BulkCreated(logger, result.Count, EntityLog.CpuCooler);

        return result;
    }
}
