using MediatR;
using PcBuilderBackend.Application.Build.Dto;
using PcBuilderBackend.Application.Common.Dto;

namespace PcBuilderBackend.Application.Build.Queries;

public class ListUserPcBuildsHandler(IPcBuildReadStore store)
    : IRequestHandler<ListUserPcBuildsQuery, PagedResult<PcBuildListItemDto>>
{
    public Task<PagedResult<PcBuildListItemDto>> Handle(
        ListUserPcBuildsQuery query,
        CancellationToken cancellationToken) =>
        store.ListByUserAsync(query.Request, cancellationToken);
}
