using AutoMapper;
using MediatR;
using Microsoft.Extensions.Logging;
using PcBuilderBackend.Application.Catalog.CpuCoolers;
using PcBuilderBackend.Application.Catalog.CpuCoolers.Commands.CreateCpuCooler;
using PcBuilderBackend.Application.Catalog.CpuCoolers.Dto;
using PcBuilderBackend.Application.Common.Interfaces;
using PcBuilderBackend.Application.Common.Logging;
using PcBuilderBackend.Application.Common.Validation;
using PcBuilderBackend.Domain.Entities;

namespace PcBuilderBackend.Application.Catalog.CpuCoolers.Commands.ImportCpuCoolers;

public class ImportCpuCoolersHandler(
    ICpuCoolerRepository cpuCoolers,
    IUnitOfWork unitOfWork,
    IActiveEntityLookup lookup,
    IExcelImportService excel,
    IMapper mapper,
    ILogger<ImportCpuCoolersHandler> logger)
    : IRequestHandler<ImportCpuCoolersCommand, List<CpuCoolerDto>>
{
    public async Task<List<CpuCoolerDto>> Handle(
        ImportCpuCoolersCommand request,
        CancellationToken cancellationToken)
    {
        var rows = await excel.ParseCpuCoolerImportAsync(request.Stream, cancellationToken);

        await ActiveEntityGuard.EnsureManufacturersExist(
            lookup, rows.Select(r => r.ManufacturerId), cancellationToken);
        await ActiveEntityGuard.EnsureSocketsExist(
            lookup, rows.SelectMany(r => r.Sockets.Select(s => s.SocketId)), cancellationToken);

        var result = new List<CpuCooler>();

        foreach (var row in rows)
        {
            var entity = new CpuCooler(row.ManufacturerId, row.Name, row.ToSpecs());

            CreateCpuCoolerHandler.ApplySockets(
                entity,
                row.Sockets.Select(s => new CpuCoolerSocketDto(s.SocketId)));

            cpuCoolers.Add(entity);
            result.Add(entity);
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);

        EntityLog.Imported(logger, result.Count, EntityLog.CpuCooler);

        return [.. result.Select(mapper.Map<CpuCoolerDto>)];
    }
}
