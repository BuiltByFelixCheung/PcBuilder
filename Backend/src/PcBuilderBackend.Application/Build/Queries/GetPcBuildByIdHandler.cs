using MediatR;
using PcBuilderBackend.Application.Build.Dto;
using PcBuilderBackend.Application.Common.Interfaces;

namespace PcBuilderBackend.Application.Build.Queries;

public class GetPcBuildByIdHandler(IPcBuildReadStore store, ICurrentUser currentUser, IIdentityService identity)
    : IRequestHandler<GetPcBuildByIdQuery, PcBuildDto?>
{
    public async Task<PcBuildDto?> Handle(GetPcBuildByIdQuery query, CancellationToken cancellationToken)
    {
        var pcBuild = await store.GetByIdAsync(query.Id, cancellationToken);
        if (pcBuild is null)
            return null;

        // Private non-owner access is indistinguishable from a missing build (404).
        if (!BuildAccess.IsVisible(pcBuild, currentUser.UserId))
            return null;

        return await PcBuildUserName.Attach(pcBuild, identity, cancellationToken);
    }
}
