using AutoMapper;
using MediatR;
using Microsoft.Extensions.Logging;
using PcBuilderBackend.Application.Catalog.ChassisFans.Dto;
using PcBuilderBackend.Application.Common.Interfaces;
using PcBuilderBackend.Application.Common.Logging;
using PcBuilderBackend.Domain.Entities;
using PcBuilderBackend.Domain.ValueObjects;

namespace PcBuilderBackend.Application.Catalog.ChassisFans.Commands.CreateChassisFan;

public class CreateChassisFanHandler(
    IChassisFanRepository chassisFans,
    IUnitOfWork unitOfWork,
    IMapper mapper,
    ILogger<CreateChassisFanHandler> logger)
    : IRequestHandler<CreateChassisFanCommand, ChassisFanDto>
{
    public async Task<ChassisFanDto> Handle(CreateChassisFanCommand request, CancellationToken cancellationToken)
    {
        var entity = new ChassisFan(
            request.Name,
            request.ManufacturerId,
            new ChassisFanSpecs
            {
                DiameterMm = request.DiameterMm,
                FansCountPerPack = request.FansCountPerPack,
                ThicknessMm = request.ThicknessMm,
                HeaderType = request.HeaderType,
                SupportsDaisyChain = request.SupportsDaisyChain,
                MaxFansPerDaisyChain = request.MaxFansPerDaisyChain
            });

        chassisFans.Add(entity);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        EntityLog.Created(logger, EntityLog.ChassisFan, entity.Id);

        return mapper.Map<ChassisFanDto>(entity);
    }
}
