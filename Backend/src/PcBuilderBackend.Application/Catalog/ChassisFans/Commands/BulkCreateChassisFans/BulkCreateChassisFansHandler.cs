using AutoMapper;
using MediatR;
using Microsoft.Extensions.Logging;
using PcBuilderBackend.Application.Catalog.ChassisFans.Dto;
using PcBuilderBackend.Application.Common.Interfaces;
using PcBuilderBackend.Application.Common.Logging;
using PcBuilderBackend.Domain.Entities;
using PcBuilderBackend.Domain.ValueObjects;

namespace PcBuilderBackend.Application.Catalog.ChassisFans.Commands.BulkCreateChassisFans;

public class BulkCreateChassisFansHandler(
    IChassisFanRepository chassisFans,
    IUnitOfWork unitOfWork,
    IMapper mapper,
    ILogger<BulkCreateChassisFansHandler> logger)
    : IRequestHandler<BulkCreateChassisFansCommand, List<ChassisFanDto>>
{
    public async Task<List<ChassisFanDto>> Handle(
        BulkCreateChassisFansCommand request,
        CancellationToken cancellationToken)
    {
        var result = new List<ChassisFanDto>();

        foreach (var entity in request.Fans.Select(item => new ChassisFan(
                     item.Name,
                     item.ManufacturerId,
                     new ChassisFanSpecs
                     {
                         DiameterMm = item.DiameterMm,
                         FansCountPerPack = item.FansCountPerPack,
                         ThicknessMm = item.ThicknessMm,
                         HeaderType = item.HeaderType,
                         SupportsDaisyChain = item.SupportsDaisyChain,
                         MaxFansPerDaisyChain = item.MaxFansPerDaisyChain
                     })))
        {
            chassisFans.Add(entity);
            result.Add(mapper.Map<ChassisFanDto>(entity));
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);
        EntityLog.BulkCreated(logger, result.Count, EntityLog.ChassisFan);
        return result;
    }
}
