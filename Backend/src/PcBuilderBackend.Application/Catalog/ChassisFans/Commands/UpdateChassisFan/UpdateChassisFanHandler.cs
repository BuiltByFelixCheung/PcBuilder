using AutoMapper;
using MediatR;
using Microsoft.Extensions.Logging;
using PcBuilderBackend.Application.Catalog.ChassisFans.Dto;
using PcBuilderBackend.Application.Common.Interfaces;
using PcBuilderBackend.Application.Common.Logging;
using PcBuilderBackend.Domain.ValueObjects;

namespace PcBuilderBackend.Application.Catalog.ChassisFans.Commands.UpdateChassisFan;

public class UpdateChassisFanHandler(
    IChassisFanRepository chassisFans,
    IUnitOfWork unitOfWork,
    IMapper mapper,
    ILogger<UpdateChassisFanHandler> logger)
    : IRequestHandler<UpdateChassisFanCommand, ChassisFanDto?>
{
    public async Task<ChassisFanDto?> Handle(UpdateChassisFanCommand request, CancellationToken cancellationToken)
    {
        var entity = await chassisFans.GetByIdAsync(request.Id, cancellationToken);

        if (entity is null)
        {
            EntityLog.NotFoundOrInactive(logger, EntityLog.ChassisFan, request.Id);
            return null;
        }

        entity.Rename(request.Name);
        entity.UpdateManufacturer(request.ManufacturerId);
        entity.UpdateSpecs(new ChassisFanSpecs
        {
            DiameterMm = request.DiameterMm,
            FansCountPerPack = request.FansCountPerPack,
            ThicknessMm = request.ThicknessMm,
            HeaderType = request.HeaderType,
            SupportsDaisyChain = request.SupportsDaisyChain,
            MaxFansPerDaisyChain = request.MaxFansPerDaisyChain
        });

        await unitOfWork.SaveChangesAsync(cancellationToken);

        EntityLog.Updated(logger, EntityLog.ChassisFan, entity.Id);

        return mapper.Map<ChassisFanDto>(entity);
    }
}
