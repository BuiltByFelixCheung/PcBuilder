using PcBuilderBackend.Domain.Entities;

namespace PcBuilderBackend.Application.Build;

public interface IBuildPictureRepository
{
    Task<BuildPicture?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<List<BuildPicture>> ListByBuildIdsAsync(
        IEnumerable<Guid> buildIds,
        CancellationToken cancellationToken);
    void Add(BuildPicture picture);
}