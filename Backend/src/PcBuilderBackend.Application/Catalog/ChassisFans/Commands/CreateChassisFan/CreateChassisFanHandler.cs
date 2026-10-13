using AutoMapper;
using MediatR;
using Microsoft.Extensions.Logging;
using PcBuilderBackend.Application.Catalog.ChassisFans.Dto;
using PcBuilderBackend.Application.Common.Interfaces;
using PcBuilderBackend.Application.Common.Logging;
using PcBuilderBackend.Domain.Entities;

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
            request.DiameterMm,
            request.FansCountPerPack,
            request.ThicknessMm,
            request.HeaderType,
            request.SupportsDaisyChain,
            request.MaxFansPerDaisyChain);

        chassisFans.Add(entity);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        EntityLog.Created(logger, EntityLog.ChassisFan, entity.Id);

        return mapper.Map<ChassisFanDto>(entity);
    }
}
