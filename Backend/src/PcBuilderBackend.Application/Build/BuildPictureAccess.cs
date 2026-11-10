using PcBuilderBackend.Application.Build.Dto;

namespace PcBuilderBackend.Application.Build;

public static class BuildPictureAccess
{
    public static async Task<bool> CanManageAsync(
        PcBuildListItemDto build,
        Guid? currentUserId,
        string? presentedToken,
        IPcBuildReadStore builds,
        CancellationToken cancellationToken)
    {
        if (BuildAccess.IsOwner(build, currentUserId))
            return true;

        if (build.UserId is not null)
            return false;

        var hash = await builds.GetPictureEditTokenHashAsync(build.Id, cancellationToken);
        return BuildPictureEditToken.Matches(hash, presentedToken);
    }
}
