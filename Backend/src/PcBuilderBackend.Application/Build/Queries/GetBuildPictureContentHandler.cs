using MediatR;
using Microsoft.Extensions.Logging;
using PcBuilderBackend.Application.Common.Interfaces;
using PcBuilderBackend.Application.Common.Logging;
using PcBuilderBackend.Application.Common.Storage;

namespace PcBuilderBackend.Application.Build.Queries;

public class GetBuildPictureContentHandler(
    IBuildPictureRepository pictures,
    IPcBuildReadStore builds,
    IStorageService storage,
    ICurrentUser currentUser,
    ILogger<GetBuildPictureContentHandler> logger)
    : IRequestHandler<GetBuildPictureContentQuery, StoredObject?>
{
    public async Task<StoredObject?> Handle(
        GetBuildPictureContentQuery request,
        CancellationToken cancellationToken)
    {
        var picture = await pictures.GetByIdAsync(request.Id, cancellationToken);
        if (picture is null)
            return null;

        var build = await builds.GetByIdAsync(picture.BuildId, cancellationToken);
        if (build is null)
        {
            EntityLog.NotFound(logger, EntityLog.PcBuild, picture.BuildId);
            return null;
        }

        if (!BuildAccess.IsVisible(build, currentUser.UserId))
        {
            EntityLog.NotAuthorized(logger, EntityLog.PcBuild, picture.BuildId);
            throw new UnauthorizedAccessException();
        }

        return await storage.OpenAsync(picture.PictureKey, cancellationToken);
    }
}
