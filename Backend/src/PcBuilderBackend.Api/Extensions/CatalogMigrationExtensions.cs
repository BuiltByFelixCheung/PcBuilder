using Microsoft.EntityFrameworkCore;
using PcBuilderBackend.Infrastructure.Persistence;

namespace PcBuilderBackend.Api.Extensions;

public static class CatalogMigrationExtensions
{
    public static async Task MigrateCatalogAsync(this WebApplication app, CancellationToken cancellationToken = default)
    {
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<PcBuilderDbContext>();
        await db.Database.MigrateAsync(cancellationToken);
    }
}
