using MediatR;
using Microsoft.Extensions.Logging;
using PcBuilderBackend.Application.Build.Dto;
using PcBuilderBackend.Application.Common.Interfaces;
using PcBuilderBackend.Application.Common.Logging;

namespace PcBuilderBackend.Application.Build.Queries;

public class ListBuildPicturesHandler(
    IPcBuildReadStore builds,
    IBuildPictureReadStore pictures,
    ICurrentUser currentUser,
    ILogger<ListBuildPicturesHandler> logger)
    : IRequestHandler<ListBuildPicturesQuery, List<BuildPictureDto>>
{
    public async Task<List<BuildPictureDto>> Handle(
        ListBuildPicturesQuery request,
        CancellationToken cancellationToken)
    {
        var build = await builds.GetByIdAsync(request.BuildId, cancellationToken);
        if (build is null)
        {
            EntityLog.NotFound(logger, EntityLog.PcBuild, request.BuildId);
            throw new KeyNotFoundException("Build was not found.");
        }

        if (!BuildAccess.IsVisible(build, currentUser.UserId))
        {
            EntityLog.NotFound(logger, EntityLog.PcBuild, request.BuildId);
            throw new KeyNotFoundException("Build was not found.");
        }

        return await pictures.ListByBuildAsync(request.BuildId, cancellationToken);
    }
}
