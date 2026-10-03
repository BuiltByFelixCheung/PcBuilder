using AutoMapper;
using MediatR;
using Microsoft.Extensions.Logging;
using PcBuilderBackend.Application.Catalog.Chassis.Dto;
using PcBuilderBackend.Application.Common.Interfaces;
using PcBuilderBackend.Application.Common.Logging;
using PcBuilderBackend.Domain.Entities;
using PcBuilderBackend.Domain.Enums;

namespace PcBuilderBackend.Application.Catalog.Chassis.Commands.BulkUpdateChassisRadiators;

public class BulkUpdateChassisRadiatorsHandler(
    IChassisRepository chassis,
    IUnitOfWork unitOfWork,
    IMapper mapper,
    ILogger<BulkUpdateChassisRadiatorsHandler> logger)
    : IRequestHandler<BulkUpdateChassisRadiatorsCommand, List<ChassisRadiatorDto>?>
{
    public async Task<List<ChassisRadiatorDto>?> Handle(
        BulkUpdateChassisRadiatorsCommand request,
        CancellationToken cancellationToken)
    {
        var entity = await chassis.GetWithChildrenAsync(request.ChassisId, cancellationToken);

        if (entity is null)
        {
            EntityLog.NotFound(logger, EntityLog.Chassis, request.ChassisId);
            return null;
        }

        var existingByKey = entity.Radiators.ToDictionary(x => (x.Length, x.MountLocation));
        var touchedKeys = new HashSet<(RadiatorClass Length, RadiatorMountLocation MountLocation)>();

        foreach (var radiator in request.Radiators)
        {
            var key = (radiator.Length, radiator.Location);
            touchedKeys.Add(key);

            if (existingByKey.TryGetValue(key, out var existing))
            {
                existing.UpdateSpecs(
                    request.ChassisId,
                    radiator.Length,
                    radiator.Location,
                    radiator.RadiatorCount);
            }
            else
            {
                entity.AddRadiator(new ChassisRadiator(
                    request.ChassisId,
                    radiator.Length,
                    radiator.Location,
                    radiator.RadiatorCount));
            }
        }

        foreach (var existing in existingByKey.Values.Where(x =>
                     !touchedKeys.Contains((x.Length, x.MountLocation))))
        {
            entity.RemoveRadiator(existing);
            chassis.DeleteRadiator(existing);
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);

        EntityLog.ChassisRadiatorsUpdated(logger, entity.Id);

        return [.. entity.Radiators
            .Where(x => x.IsActive)
            .Select(mapper.Map<ChassisRadiatorDto>)];
    }
}
