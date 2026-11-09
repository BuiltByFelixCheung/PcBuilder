using Microsoft.EntityFrameworkCore;
using PcBuilderBackend.Application.Build;
using PcBuilderBackend.Domain.Entities;

namespace PcBuilderBackend.Infrastructure.Persistence.Repositories;

public sealed class BuildPictureRepository(PcBuilderDbContext db) : IBuildPictureRepository
{
    public Task<BuildPicture?> GetByIdAsync(Guid id, CancellationToken cancellationToken) =>
        db.BuildPictures.FirstOrDefaultAsync(picture => picture.Id == id, cancellationToken);

    public Task<List<BuildPicture>> ListByBuildIdsAsync(
        IEnumerable<Guid> buildIds,
        CancellationToken cancellationToken)
    {
        var ids = buildIds.Distinct().ToList();
        if (ids.Count == 0)
            return Task.FromResult<List<BuildPicture>>([]);

        return db.BuildPictures
            .Where(picture => ids.Contains(picture.BuildId))
            .ToListAsync(cancellationToken);
    }

    public void Add(BuildPicture picture) => db.BuildPictures.Add(picture);
}