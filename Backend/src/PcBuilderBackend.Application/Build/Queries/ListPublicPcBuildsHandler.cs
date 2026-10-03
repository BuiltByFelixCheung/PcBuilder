using MediatR;
using PcBuilderBackend.Application.Build.Dto;
using PcBuilderBackend.Application.Common.Dto;

namespace PcBuilderBackend.Application.Build.Queries;

public class ListPublicPcBuildsHandler(IPcBuildReadStore store) : IRequestHandler<ListPublicPcBuildsQuery, PagedResult<PcBuildListItemDto>>
{
    public async Task<PagedResult<PcBuildListItemDto>> Handle(ListPublicPcBuildsQuery query, CancellationToken cancellationToken)
    {
        return await store.ListPublicAsync(query.Request, cancellationToken);
    }
}