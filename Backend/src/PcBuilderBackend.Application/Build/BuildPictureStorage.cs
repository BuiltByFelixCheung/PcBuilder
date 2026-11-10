using PcBuilderBackend.Application.Common.Interfaces;

namespace PcBuilderBackend.Application.Build;

public static class BuildPictureStorage
{
    public static async Task RemoveForBuildsAsync(
        IBuildPictureRepository pictures,
        IStorageService storage,
        IEnumerable<Guid> buildIds,
        CancellationToken cancellationToken)
    {
        var rows = await pictures.ListByBuildIdsAsync(buildIds, cancellationToken);
        foreach (var picture in rows)
        {
            await storage.DeleteAsync(picture.PictureKey, cancellationToken);
            picture.Deactivate();
        }
    }
}
