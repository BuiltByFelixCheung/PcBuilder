using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;
using PcBuilderBackend.Application.Common.Options;
using PcBuilderBackend.Application.Seo;

namespace PcBuilderBackend.Api.Extensions;

public static class SpaFallbackExtensions
{
    private static readonly TimeSpan CacheLifetime = TimeSpan.FromMinutes(10);
    private const string TemplateKey = "seo:shell:template";

    public static void MapSpaFallback(this WebApplication app)
    {
        app.MapFallback(async context =>
        {
            if (IsReserved(context.Request.Path))
            {
                context.Response.StatusCode = StatusCodes.Status404NotFound;
                return;
            }

            var cancellationToken = context.RequestAborted;
            var cache = context.RequestServices.GetRequiredService<IMemoryCache>();
            var options = context.RequestServices.GetRequiredService<AppOptions>();
            var pages = context.RequestServices.GetRequiredService<ISpaPageSource>();
            var result = await Resolve(pages, cache, options, context.Request.Path.Value, cancellationToken);

            context.Response.ContentType = "text/html; charset=utf-8";
            if (result.Status == SpaResolution.NotFound && result.Page is not null)
            {
                context.Response.StatusCode = StatusCodes.Status404NotFound;
                context.Response.Headers.CacheControl = "no-store";
                await context.Response.WriteAsync(SpaShell.NotFoundDocument(result.Page), cancellationToken);
                return;
            }

            var template = await Template(app, cache, cancellationToken);
            if (template is null)
            {
                context.Response.StatusCode = StatusCodes.Status404NotFound;
                return;
            }

            if (result.Status == SpaResolution.Page && result.Page is not null)
            {
                var indexable = result.Page.Robots.StartsWith("index", StringComparison.Ordinal);
                context.Response.Headers.CacheControl = indexable ? "public, max-age=600" : "no-store";
                await context.Response.WriteAsync(
                    SpaShell.Apply(template, result.Page, options.PublicBaseUrl),
                    cancellationToken);
                return;
            }

            context.Response.Headers.CacheControl = "no-store";
            await context.Response.WriteAsync(template, cancellationToken);
        }).ExcludeFromDescription();
    }

    private static bool IsReserved(PathString path) =>
        path.StartsWithSegments("/api")
        || path.StartsWithSegments("/openapi")
        || path.StartsWithSegments("/scalar");

    private static async Task<SpaResolutionResult> Resolve(
        ISpaPageSource pages,
        IMemoryCache cache,
        AppOptions options,
        string? requestPath,
        CancellationToken cancellationToken)
    {
        var origin = options.PublicBaseUrl.Trim().TrimEnd('/');
        var key = $"seo:shell:{origin}:{SpaRoutes.Normalize(requestPath)}";
        if (cache.TryGetValue(key, out SpaPage? cached) && cached is not null)
            return SpaResolutionResult.Found(cached);

        var result = await pages.ResolveAsync(requestPath, cancellationToken);
        if (result.Status == SpaResolution.Page && result.Page is not null)
            cache.Set(key, result.Page, CacheLifetime);

        return result;
    }

    private static async Task<string?> Template(
        WebApplication app,
        IMemoryCache cache,
        CancellationToken cancellationToken)
    {
        if (cache.TryGetValue(TemplateKey, out string? cached) && cached is not null)
            return cached;

        var file = app.Environment.WebRootFileProvider.GetFileInfo("index.html");
        if (!file.Exists)
            return null;

        await using var stream = file.CreateReadStream();
        using var reader = new StreamReader(stream);
        var template = await reader.ReadToEndAsync(cancellationToken);
        cache.Set(TemplateKey, template, CacheLifetime);
        return template;
    }
}
