using MediatR;
using Microsoft.Extensions.Logging;
using PcBuilderBackend.Application.Common.Interfaces;
using PcBuilderBackend.Application.Common.Logging;

namespace PcBuilderBackend.Application.Build.Commands.BulkDeletePcBuild;

public class BulkDeletePcBuildHandler(
    IPcBuildRepository pcBuilds,
    ILogger<BulkDeletePcBuildHandler> logger,
    ICurrentUser currentUser,
    IUnitOfWork unitOfWork) : IRequestHandler<BulkDeletePcBuildCommand, bool>
{
    public async Task<bool> Handle(BulkDeletePcBuildCommand command, CancellationToken cancellationToken)
    {
        var ids = command.Ids.Distinct().ToList();
        var entities = await pcBuilds.GetByIdsAsync(ids);

        if (entities.Count != ids.Count)
        {
            EntityLog.BulkAborted(logger, "DELETE", EntityLog.PcBuild, ids.Count, entities.Count);
            return false;
        }

        if (currentUser.UserId is not { } userId
            || entities.Any(entity => entity.User is null || entity.User.UserId != userId))
        {
            EntityLog.NotAuthorized(logger, EntityLog.PcBuild, ids[0]);
            throw new UnauthorizedAccessException();
        }

        foreach (var entity in entities)
        {
            entity.Deactivate();
            entity.User!.Deactivate();
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);
        EntityLog.BulkDeleted(logger, entities.Count, EntityLog.PcBuild);
        return true;
    }
}
