using MediatR;
using PcBuilderBackend.Application.Build.Dto;
using PcBuilderBackend.Application.Common.Interfaces;

namespace PcBuilderBackend.Application.Build.Queries;

public class GetPcBuildByIdHandler(IPcBuildReadStore store, ICurrentUser currentUser)
    : IRequestHandler<GetPcBuildByIdQuery, PcBuildDto?>
{
    public async Task<PcBuildDto?> Handle(GetPcBuildByIdQuery query, CancellationToken cancellationToken)
    {
        var pcBuild = await store.GetByIdAsync(query.Id, cancellationToken);
        if (pcBuild is null)
            return null;

        if (pcBuild.UserId is { } ownerId
            && !pcBuild.IsPublic
            && currentUser.UserId != ownerId)
            throw new UnauthorizedAccessException();

        return pcBuild;
    }
}
