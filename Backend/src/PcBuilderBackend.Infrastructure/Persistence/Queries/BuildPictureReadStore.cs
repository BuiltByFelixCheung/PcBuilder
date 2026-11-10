using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.EntityFrameworkCore;
using PcBuilderBackend.Application.Build.Dto;
using PcBuilderBackend.Application.Build;

namespace PcBuilderBackend.Infrastructure.Persistence.Queries;

public sealed class BuildPictureReadStore(PcBuilderDbContext db, IMapper mapper) : IBuildPictureReadStore
{
    public Task<List<BuildPictureDto>> ListByBuildAsync(
        Guid buildId,
        CancellationToken cancellationToken) =>
        db.BuildPictures
            .AsNoTracking()
            .Where(picture => picture.BuildId == buildId)
            .OrderBy(picture => picture.CreatedAtUtc)
            .ThenBy(picture => picture.Id)
            .ProjectTo<BuildPictureDto>(mapper.ConfigurationProvider)
            .ToListAsync(cancellationToken);
}