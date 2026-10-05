using MediatR;
using PcBuilderBackend.Application.Build.Dto;
using PcBuilderBackend.Application.Common.Dto;
using PcBuilderBackend.Application.Common.Interfaces;

namespace PcBuilderBackend.Application.Build.Queries;

public class ListUserPcBuildsHandler(IPcBuildReadStore store, IIdentityService identity)
    : IRequestHandler<ListUserPcBuildsQuery, PagedResult<PcBuildListItemDto>>
{
    public async Task<PagedResult<PcBuildListItemDto>> Handle(
        ListUserPcBuildsQuery query,
        CancellationToken cancellationToken)
    {
        var page = await store.ListByUserAsync(query.Request, cancellationToken);
        return await PcBuildUserName.Attach(page, identity, cancellationToken);
    }
}
