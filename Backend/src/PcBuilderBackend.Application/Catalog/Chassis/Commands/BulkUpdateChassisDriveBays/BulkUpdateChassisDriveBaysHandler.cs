using AutoMapper;
using MediatR;
using Microsoft.Extensions.Logging;
using PcBuilderBackend.Application.Catalog.Chassis.Dto;
using PcBuilderBackend.Application.Common.Interfaces;
using PcBuilderBackend.Application.Common.Logging;
using PcBuilderBackend.Domain.Entities;
using PcBuilderBackend.Domain.Enums;

namespace PcBuilderBackend.Application.Catalog.Chassis.Commands.BulkUpdateChassisDriveBays;

public class BulkUpdateChassisDriveBaysHandler(
    IChassisRepository chassis,
    IUnitOfWork unitOfWork,
    IMapper mapper,
    ILogger<BulkUpdateChassisDriveBaysHandler> logger)
    : IRequestHandler<BulkUpdateChassisDriveBaysCommand, List<ChassisDriveBayDto>?>
{
    public async Task<List<ChassisDriveBayDto>?> Handle(
        BulkUpdateChassisDriveBaysCommand request,
        CancellationToken cancellationToken)
    {
        var entity = await chassis.GetWithChildrenAsync(request.ChassisId, cancellationToken);

        if (entity is null)
        {
            EntityLog.NotFound(logger, EntityLog.Chassis, request.ChassisId);
            return null;
        }

        var existingByKey = entity.DriveBays.ToDictionary(FormFactorKey);
        var touchedKeys = new HashSet<string>();

        foreach (var bay in request.DriveBays)
        {
            var key = FormFactorKey(bay.FormFactors);
            touchedKeys.Add(key);

            if (existingByKey.TryGetValue(key, out var existing))
            {
                existing.UpdateSpecs(request.ChassisId, bay.FormFactors, bay.SlotCount);
            }
            else
            {
                entity.AddDriveBay(new ChassisDriveBay(
                    request.ChassisId,
                    bay.FormFactors,
                    bay.SlotCount));
            }
        }

        foreach (var existing in existingByKey.Values.Where(x => !touchedKeys.Contains(FormFactorKey(x))))
        {
            entity.RemoveDriveBay(existing);
            chassis.DeleteDriveBay(existing);
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);

        EntityLog.ChassisDriveBaysUpdated(logger, entity.Id);

        return [.. entity.DriveBays
            .Where(x => x.IsActive)
            .Select(mapper.Map<ChassisDriveBayDto>)];
    }

    private static string FormFactorKey(ChassisDriveBay bay) =>
        string.Join(',', bay.DriveBayFormFactors);

    private static string FormFactorKey(IEnumerable<DriveBayFormFactor> formFactors) =>
        string.Join(',', ChassisDriveBay.NormalizeFormFactors(formFactors));
}
