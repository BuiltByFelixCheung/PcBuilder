using MediatR;
using Microsoft.Extensions.Logging;
using PcBuilderBackend.Application.Common.Interfaces;
using PcBuilderBackend.Application.Common.Logging;

namespace PcBuilderBackend.Application.Build.Commands.DeletePcBuild;

public class DeletePcBuildHandler(
    IUnitOfWork unitOfWork,
    IPcBuildRepository pcBuilds,
    ICurrentUser currentUser,
    ILogger<DeletePcBuildHandler> logger) : IRequestHandler<DeletePcBuildCommand, bool>
{
    public async Task<bool> Handle(DeletePcBuildCommand command, CancellationToken cancellationToken)
    {
        var pcBuild = await pcBuilds.GetWithChildrenAsync(command.Id);

        if (pcBuild is null)
        {
            EntityLog.NotFound(logger, EntityLog.PcBuild, command.Id);
            return false;
        }

        if (pcBuild.User is null || currentUser.UserId is not { } userId || pcBuild.User.UserId != userId)
        {
            EntityLog.NotAuthorized(logger, EntityLog.PcBuild, command.Id);
            throw new UnauthorizedAccessException();
        }

        pcBuild.Deactivate();
        pcBuild.User.Deactivate();

        await unitOfWork.SaveChangesAsync(cancellationToken);
        EntityLog.Deleted(logger, EntityLog.PcBuild, pcBuild.Id);
        EntityLog.Deleted(logger, EntityLog.PcBuildUser, pcBuild.User.Id);
        return true;
    }
}
