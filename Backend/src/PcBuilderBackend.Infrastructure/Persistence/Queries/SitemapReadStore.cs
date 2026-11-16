using Microsoft.EntityFrameworkCore;
using PcBuilderBackend.Application.Seo;
using PcBuilderBackend.Domain.Entities;

namespace PcBuilderBackend.Infrastructure.Persistence.Queries;

public sealed class SitemapReadStore(PcBuilderDbContext context) : ISitemapReadStore
{
    public async Task<IReadOnlyList<SitemapEntry>> ListAsync(CancellationToken cancellationToken)
    {
        var entries = new List<SitemapEntry>
        {
            new("/"),
            new("/catalog/chassis"),
            new("/catalog/motherboards"),
            new("/catalog/cpus"),
            new("/catalog/graphics-cards"),
            new("/catalog/memories"),
            new("/catalog/storage"),
            new("/catalog/psus"),
            new("/catalog/cpu-coolers"),
            new("/catalog/chassis-fans"),
            new("/catalog/wired-network-adapters"),
            new("/catalog/wireless-network-adapters"),
            new("/builds"),
        };

        entries.AddRange(await Active(context.Chassis, "/catalog/chassis", cancellationToken));
        entries.AddRange(await Active(context.Motherboards, "/catalog/motherboards", cancellationToken));
        entries.AddRange(await Active(context.Cpus, "/catalog/cpus", cancellationToken));
        entries.AddRange(await Active(context.GraphicsCards, "/catalog/graphics-cards", cancellationToken));
        entries.AddRange(await Active(context.Rams, "/catalog/memories", cancellationToken));
        entries.AddRange(await Active(context.StorageDrives, "/catalog/storage", cancellationToken));
        entries.AddRange(await Active(context.Psus, "/catalog/psus", cancellationToken));
        entries.AddRange(await Active(context.CpuCoolers, "/catalog/cpu-coolers", cancellationToken));
        entries.AddRange(await Active(context.ChassisFans, "/catalog/chassis-fans", cancellationToken));
        entries.AddRange(await Active(context.WiredNetworkAdapters, "/catalog/wired-network-adapters", cancellationToken));
        entries.AddRange(await Active(context.WirelessNetworkAdapters, "/catalog/wireless-network-adapters", cancellationToken));
        entries.AddRange(await PublicBuilds(cancellationToken));
        return entries;
    }

    private static async Task<List<SitemapEntry>> Active<TEntity>(
        DbSet<TEntity> products,
        string catalogPath,
        CancellationToken cancellationToken)
        where TEntity : BaseEntity
    {
        var rows = await products
            .AsNoTracking()
            .Where(product => product.IsActive)
            .Select(product => new { product.Id, product.UpdatedAtUtc, product.CreatedAtUtc })
            .ToListAsync(cancellationToken);

        return rows
            .Select(row => new SitemapEntry(
                $"{catalogPath}/{row.Id:D}",
                row.UpdatedAtUtc ?? row.CreatedAtUtc))
            .ToList();
    }

    private async Task<List<SitemapEntry>> PublicBuilds(CancellationToken cancellationToken)
    {
        var rows = await context.PcBuilds
            .AsNoTracking()
            .Where(build => build.IsActive && build.User != null && build.User.IsPublic)
            .Select(build => new { build.Id, build.UpdatedAtUtc, build.CreatedAtUtc })
            .ToListAsync(cancellationToken);

        return rows
            .Select(row => new SitemapEntry(
                $"/builds/{row.Id:D}",
                row.UpdatedAtUtc ?? row.CreatedAtUtc))
            .ToList();
    }
}
