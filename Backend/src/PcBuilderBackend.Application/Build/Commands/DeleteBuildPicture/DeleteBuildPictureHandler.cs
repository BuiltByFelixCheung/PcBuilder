using MediatR;
using Microsoft.Extensions.Logging;
using PcBuilderBackend.Application.Common.Interfaces;
using PcBuilderBackend.Application.Common.Logging;

namespace PcBuilderBackend.Application.Build.Commands.DeleteBuildPicture;

public class DeleteBuildPictureHandler(
    IBuildPictureRepository pictures,
    IPcBuildReadStore builds,
    IStorageService storage,
    IUnitOfWork unitOfWork,
    ICurrentUser currentUser,
    ILogger<DeleteBuildPictureHandler> logger)
    : IRequestHandler<DeleteBuildPictureCommand, bool>
{
    public async Task<bool> Handle(DeleteBuildPictureCommand request, CancellationToken cancellationToken)
    {
        var entity = await pictures.GetByIdAsync(request.Id, cancellationToken);
        if (entity is null)
        {
            EntityLog.NotFoundOrInactive(logger, EntityLog.BuildPicture, request.Id);
            return false;
        }

        var build = await builds.GetByIdAsync(entity.BuildId, cancellationToken);
        if (build is null)
        {
            EntityLog.NotFound(logger, EntityLog.PcBuild, entity.BuildId);
            return false;
        }

        if (!BuildAccess.IsOwner(build, currentUser.UserId))
        {
            EntityLog.NotAuthorized(logger, EntityLog.PcBuild, entity.BuildId);
            throw new UnauthorizedAccessException();
        }

        await storage.DeleteAsync(entity.PictureKey, cancellationToken);
        entity.Deactivate();
        await unitOfWork.SaveChangesAsync(cancellationToken);
        EntityLog.Deleted(logger, EntityLog.BuildPicture, entity.Id);
        return true;
    }
}
