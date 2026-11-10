using PcBuilderBackend.Application.Build.Dto;

namespace PcBuilderBackend.Application.Build;

public interface IBuildPictureReadStore
{
    Task<List<BuildPictureDto>> ListByBuildAsync(
        Guid buildId,
        CancellationToken cancellationToken);
}