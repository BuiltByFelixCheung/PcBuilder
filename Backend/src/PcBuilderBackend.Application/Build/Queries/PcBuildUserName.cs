using PcBuilderBackend.Application.Build.Dto;
using PcBuilderBackend.Application.Common.Dto;
using PcBuilderBackend.Application.Common.Interfaces;

namespace PcBuilderBackend.Application.Build.Queries;

internal static class PcBuildUserName
{
    public static async Task<PcBuildListItemDto> Attach(
        PcBuildListItemDto item,
        IIdentityService identity,
        CancellationToken cancellationToken) =>
        item with { UserName = await Lookup(item.UserId, identity, cancellationToken) };

    public static async Task<PcBuildDto> Attach(
        PcBuildDto item,
        IIdentityService identity,
        CancellationToken cancellationToken) =>
        item with { UserName = await Lookup(item.UserId, identity, cancellationToken) };

    public static async Task<PagedResult<PcBuildListItemDto>> Attach(
        PagedResult<PcBuildListItemDto> page,
        IIdentityService identity,
        CancellationToken cancellationToken)
    {
        var items = new List<PcBuildListItemDto>(page.Items.Count);
        foreach (var item in page.Items)
            items.Add(await Attach(item, identity, cancellationToken));

        return page with { Items = items };
    }

    private static async Task<string?> Lookup(
        Guid? userId,
        IIdentityService identity,
        CancellationToken cancellationToken)
    {
        if (userId is not { } id)
            return null;

        var user = await identity.GetUserAsync(id, cancellationToken);
        return user?.UserName;
    }
}
