using Microsoft.EntityFrameworkCore;
using PcBuilderBackend.Application.Common.Options;
using PcBuilderBackend.Application.Seo;
using PcBuilderBackend.Domain.Entities;

namespace PcBuilderBackend.Infrastructure.Persistence.Queries;

public sealed class SpaPageSource(PcBuilderDbContext context, AppOptions options) : ISpaPageSource
{
    private const int FirstPageSize = 10;

    public Task<SpaResolutionResult> ResolveAsync(string? requestPath, CancellationToken cancellationToken)
    {
        var route = SpaRoutes.Match(requestPath);
        return route.Kind switch
        {
            SpaRouteKind.Home => Ready(SpaPages.Home(options.PublicBaseUrl)),
            SpaRouteKind.Private => Ready(SpaPages.Private(route.Path)),
            SpaRouteKind.NotFound => ReadyMissing(route),
            SpaRouteKind.CatalogList => CatalogList(route, cancellationToken),
            SpaRouteKind.CatalogDetail => CatalogDetail(route, cancellationToken),
            SpaRouteKind.BuildList => BuildList(cancellationToken),
            SpaRouteKind.BuildDetail => BuildDetail(route, cancellationToken),
            _ => Task.FromResult(SpaResolutionResult.Passthrough()),
        };
    }

    private static Task<SpaResolutionResult> Ready(SpaPage page) =>
        Task.FromResult(SpaResolutionResult.Found(page));

    private static Task<SpaResolutionResult> ReadyMissing(SpaRoute route) =>
        Task.FromResult(route.Section is null
            ? SpaResolutionResult.Missing(SpaPages.MissingBuild())
            : SpaResolutionResult.Missing(SpaPages.MissingProduct(route.Section)));

    private async Task<SpaResolutionResult> CatalogList(SpaRoute route, CancellationToken cancellationToken)
    {
        if (route.Section is null)
            return SpaResolutionResult.Passthrough();

        var links = await FirstPage(route.Section.Key, cancellationToken);
        return SpaResolutionResult.Found(SpaPages.CatalogList(route.Section, links, options.PublicBaseUrl));
    }

    private async Task<SpaResolutionResult> CatalogDetail(SpaRoute route, CancellationToken cancellationToken)
    {
        if (route.Section is null || route.Id is not Guid id)
            return route.Section is null
                ? SpaResolutionResult.Passthrough()
                : SpaResolutionResult.Missing(SpaPages.MissingProduct(route.Section));

        var product = await FindProduct(route.Section.Key, id, cancellationToken);
        if (product is null)
            return SpaResolutionResult.Missing(SpaPages.MissingProduct(route.Section));

        var pictureId = await context.ProductPictures
            .AsNoTracking()
            .Where(picture => picture.ProductType == route.Section.ProductType && picture.ProductId == id)
            .OrderBy(picture => picture.CreatedAtUtc)
            .ThenBy(picture => picture.Id)
            .Select(picture => (Guid?)picture.Id)
            .FirstOrDefaultAsync(cancellationToken);

        return SpaResolutionResult.Found(SpaPages.Product(
            route.Section,
            id,
            product.Name,
            product.Manufacturer,
            pictureId,
            options.PublicBaseUrl));
    }

    private async Task<SpaResolutionResult> BuildList(CancellationToken cancellationToken)
    {
        var rows = await context.PcBuilds
            .AsNoTracking()
            .Where(build => build.IsActive && build.User != null && build.User.IsPublic)
            .OrderBy(build => build.Name)
            .ThenBy(build => build.Id)
            .Take(FirstPageSize)
            .Select(build => new { build.Id, build.Name })
            .ToListAsync(cancellationToken);

        var links = rows.Select(row => new SpaLink(row.Name, $"/builds/{row.Id:D}")).ToList();
        return SpaResolutionResult.Found(SpaPages.BuildList(links, options.PublicBaseUrl));
    }

    private async Task<SpaResolutionResult> BuildDetail(SpaRoute route, CancellationToken cancellationToken)
    {
        if (route.Id is not Guid id)
            return SpaResolutionResult.Missing(SpaPages.MissingBuild());

        var build = await context.PcBuilds
            .AsNoTracking()
            .Where(item => item.Id == id && item.IsActive && item.User != null && item.User.IsPublic)
            .Select(item => new { item.Name, item.Description })
            .FirstOrDefaultAsync(cancellationToken);

        return build is null
            ? SpaResolutionResult.Missing(SpaPages.MissingBuild())
            : SpaResolutionResult.Found(SpaPages.Build(id, build.Name, build.Description, options.PublicBaseUrl));
    }

    private Task<IReadOnlyList<SpaLink>> FirstPage(string key, CancellationToken cancellationToken)
    {
        var prefix = $"/catalog/{key}";
        return key switch
        {
            "chassis" => Links(context.Chassis, prefix, cancellationToken),
            "motherboards" => Links(context.Motherboards, prefix, cancellationToken),
            "cpus" => Links(context.Cpus, prefix, cancellationToken),
            "graphics-cards" => Links(context.GraphicsCards, prefix, cancellationToken),
            "memories" => Links(context.Rams, prefix, cancellationToken),
            "storage" => Links(context.StorageDrives, prefix, cancellationToken),
            "psus" => Links(context.Psus, prefix, cancellationToken),
            "cpu-coolers" => Links(context.CpuCoolers, prefix, cancellationToken),
            "chassis-fans" => Links(context.ChassisFans, prefix, cancellationToken),
            "wired-network-adapters" => Links(context.WiredNetworkAdapters, prefix, cancellationToken),
            "wireless-network-adapters" => Links(context.WirelessNetworkAdapters, prefix, cancellationToken),
            _ => Task.FromResult<IReadOnlyList<SpaLink>>([]),
        };
    }

    private Task<ProductSummary?> FindProduct(string key, Guid id, CancellationToken cancellationToken) =>
        key switch
        {
            "chassis" => Find(context.Chassis, id, cancellationToken),
            "motherboards" => Find(context.Motherboards, id, cancellationToken),
            "cpus" => Find(context.Cpus, id, cancellationToken),
            "graphics-cards" => Find(context.GraphicsCards, id, cancellationToken),
            "memories" => Find(context.Rams, id, cancellationToken),
            "storage" => Find(context.StorageDrives, id, cancellationToken),
            "psus" => Find(context.Psus, id, cancellationToken),
            "cpu-coolers" => Find(context.CpuCoolers, id, cancellationToken),
            "chassis-fans" => Find(context.ChassisFans, id, cancellationToken),
            "wired-network-adapters" => Find(context.WiredNetworkAdapters, id, cancellationToken),
            "wireless-network-adapters" => Find(context.WirelessNetworkAdapters, id, cancellationToken),
            _ => Task.FromResult<ProductSummary?>(null),
        };

    private static async Task<IReadOnlyList<SpaLink>> Links<TEntity>(
        DbSet<TEntity> products,
        string prefix,
        CancellationToken cancellationToken)
        where TEntity : NamedEntity
    {
        var rows = await products
            .AsNoTracking()
            .Where(product => product.IsActive)
            .OrderBy(product => product.Name)
            .ThenBy(product => product.Id)
            .Take(FirstPageSize)
            .Select(product => new { product.Id, product.Name })
            .ToListAsync(cancellationToken);

        return rows.Select(row => new SpaLink(row.Name, $"{prefix}/{row.Id:D}")).ToList();
    }

    private static async Task<ProductSummary?> Find<TEntity>(
        DbSet<TEntity> products,
        Guid id,
        CancellationToken cancellationToken)
        where TEntity : ProductEntity
    {
        var row = await products
            .AsNoTracking()
            .Where(product => product.Id == id && product.IsActive)
            .Select(product => new { product.Name, Manufacturer = product.Manufacturer.Name })
            .FirstOrDefaultAsync(cancellationToken);

        return row is null ? null : new ProductSummary(row.Name, row.Manufacturer);
    }

    private sealed record ProductSummary(string Name, string Manufacturer);
}
