using AutoMapper;
using MediatR;
using Microsoft.Extensions.Logging;
using PcBuilderBackend.Application.Catalog.ChassisFans.Dto;
using PcBuilderBackend.Application.Common.Interfaces;
using PcBuilderBackend.Application.Common.Logging;
using PcBuilderBackend.Application.Common.Validation;
using PcBuilderBackend.Domain.Entities;
using PcBuilderBackend.Domain.ValueObjects;

namespace PcBuilderBackend.Application.Catalog.ChassisFans.Commands.ImportChassisFans;

public class ImportChassisFansHandler(
    IChassisFanRepository chassisFans,
    IUnitOfWork unitOfWork,
    IActiveEntityLookup lookup,
    IExcelImportService excel,
    IMapper mapper,
    ILogger<ImportChassisFansHandler> logger)
    : IRequestHandler<ImportChassisFansCommand, List<ChassisFanDto>>
{
    public async Task<List<ChassisFanDto>> Handle(
        ImportChassisFansCommand request,
        CancellationToken cancellationToken)
    {
        var rows = await excel.ParseChassisFanImportAsync(request.Stream, cancellationToken);

        await ActiveEntityGuard.EnsureManufacturersExist(
            lookup, rows.Select(r => r.ManufacturerId), cancellationToken);

        var result = new List<ChassisFan>();

        foreach (var row in rows)
        {
            var entity = new ChassisFan(
                row.Name,
                row.ManufacturerId,
                new ChassisFanSpecs
                {
                    DiameterMm = row.DiameterMm,
                    FansCountPerPack = row.FansCountPerPack,
                    ThicknessMm = row.ThicknessMm,
                    HeaderType = row.HeaderType,
                    SupportsDaisyChain = row.SupportsDaisyChain,
                    MaxFansPerDaisyChain = row.MaxFansPerDaisyChain
                });

            chassisFans.Add(entity);
            result.Add(entity);
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);

        EntityLog.Imported(logger, result.Count, EntityLog.ChassisFan);

        return [.. result.Select(mapper.Map<ChassisFanDto>)];
    }
}
