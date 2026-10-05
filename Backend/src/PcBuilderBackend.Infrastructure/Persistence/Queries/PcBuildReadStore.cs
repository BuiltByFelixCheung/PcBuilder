using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.EntityFrameworkCore;
using PcBuilderBackend.Application.Build;
using PcBuilderBackend.Application.Build.Dto;
using PcBuilderBackend.Application.Common.Dto;
using PcBuilderBackend.Application.Common.Extensions;
using PcBuilderBackend.Application.Common.Interfaces;

namespace PcBuilderBackend.Infrastructure.Persistence.Queries;

public class PcBuildReadStore(PcBuilderDbContext context, ICurrentUser user, IMapper mapper) : IPcBuildReadStore
{
    public Task<PcBuildDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken) =>
        context.PcBuilds
            .AsNoTracking()
            .Where(p => p.Id == id && p.IsActive)
            .ProjectTo<PcBuildDto>(mapper.ConfigurationProvider)
            .FirstOrDefaultAsync(cancellationToken);

    public Task<PagedResult<PcBuildListItemDto>> ListPublicAsync(
        PagedRequest request,
        CancellationToken cancellationToken) =>
        context.PcBuilds
            .AsNoTracking()
            .Where(p => p.IsActive && p.User != null && p.User.IsPublic)
            .ApplySorting(request.SortFields, request.SortDirection)
            .ToPagedResultAsync<Domain.Entities.PcBuild, PcBuildListItemDto>(
                request.PageIndex,
                request.PageSize,
                mapper.ConfigurationProvider,
                cancellationToken);

    public Task<PagedResult<PcBuildListItemDto>> ListByUserAsync(
        PagedRequest request,
        CancellationToken cancellationToken)
    {
        if (user.UserId is not { } userId)
            return Task.FromResult(PagedResult<PcBuildListItemDto>.Empty(request));

        return context.PcBuilds
            .AsNoTracking()
            .Where(p => p.IsActive && p.User != null && p.User.UserId == userId)
            .ApplySorting(request.SortFields, request.SortDirection)
            .ToPagedResultAsync<Domain.Entities.PcBuild, PcBuildListItemDto>(
                request.PageIndex,
                request.PageSize,
                mapper.ConfigurationProvider,
                cancellationToken);
    }
}
