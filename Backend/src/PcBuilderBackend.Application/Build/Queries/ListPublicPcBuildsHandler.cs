using MediatR;
using PcBuilderBackend.Application.Build.Dto;
using PcBuilderBackend.Application.Common.Dto;
using PcBuilderBackend.Application.Common.Interfaces;

namespace PcBuilderBackend.Application.Build.Queries;

public class ListPublicPcBuildsHandler(IPcBuildReadStore store, IIdentityService identity)
    : IRequestHandler<ListPublicPcBuildsQuery, PagedResult<PcBuildListItemDto>>
{
    public async Task<PagedResult<PcBuildListItemDto>> Handle(
        ListPublicPcBuildsQuery query,
        CancellationToken cancellationToken)
    {
        var page = await store.ListPublicAsync(query.Request, cancellationToken);
        return await PcBuildUserName.Attach(page, identity, cancellationToken);
    }
}
