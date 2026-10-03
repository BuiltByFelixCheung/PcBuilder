using MediatR;
using Microsoft.Extensions.Logging;
using PcBuilderBackend.Application.Common.Interfaces;
using PcBuilderBackend.Application.Common.Logging;

namespace PcBuilderBackend.Application.Catalog.ChassisFans.Commands.BulkDeleteChassisFans;

public class BulkDeleteChassisFansHandler(
    IChassisFanRepository chassisFans,
    IUnitOfWork unitOfWork,
    ILogger<BulkDeleteChassisFansHandler> logger)
    : IRequestHandler<BulkDeleteChassisFansCommand, bool>
{
    public async Task<bool> Handle(BulkDeleteChassisFansCommand request, CancellationToken cancellationToken)
    {
        var ids = request.Ids.Distinct().ToList();
        var entities = await chassisFans.GetByIdsAsync(ids, cancellationToken);

        if (entities.Count != ids.Count)
        {
            EntityLog.BulkAborted(logger, "delete", EntityLog.ChassisFan, ids.Count, entities.Count);
            return false;
        }

        foreach (var entity in entities)
            entity.Deactivate();

        await unitOfWork.SaveChangesAsync(cancellationToken);
        EntityLog.BulkDeleted(logger, entities.Count, EntityLog.ChassisFan);
        return true;
    }
}
