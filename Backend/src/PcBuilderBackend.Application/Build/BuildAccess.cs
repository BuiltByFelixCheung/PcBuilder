using PcBuilderBackend.Application.Build.Dto;

namespace PcBuilderBackend.Application.Build;

public static class BuildAccess
{
    public static bool IsOwner(PcBuildListItemDto build, Guid? currentUserId) =>
        build.UserId is { } ownerId && currentUserId == ownerId;

    public static bool IsVisible(PcBuildListItemDto build, Guid? currentUserId) =>
        build.UserId is null || build.IsPublic || IsOwner(build, currentUserId);
}
