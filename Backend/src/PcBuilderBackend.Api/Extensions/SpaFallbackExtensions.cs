using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Primitives;

namespace PcBuilderBackend.Api.Extensions;

public static class SpaFallbackExtensions
{
    internal const string SpaFallbackFile = "__spa-fallback.html";

    public static void MapSpaFallback(this WebApplication app)
    {
        app.MapFallback(async context =>
        {
            var relative = ResolveSpaFile(
                app.Environment.WebRootFileProvider,
                context.Request.Path,
                context.Request.QueryString.HasValue);

            if (relative is null)
            {
                context.Response.StatusCode = StatusCodes.Status404NotFound;
                return;
            }

            var file = app.Environment.WebRootFileProvider.GetFileInfo(relative);
            if (!file.Exists || file.IsDirectory || file.PhysicalPath is null)
            {
                context.Response.StatusCode = StatusCodes.Status404NotFound;
                return;
            }

            context.Response.ContentType = "text/html; charset=utf-8";
            await context.Response.SendFileAsync(file);
        }).ExcludeFromDescription();
    }

    internal static string? ResolveSpaFile(IFileProvider files, PathString path, bool hasQuery)
    {
        if (path.StartsWithSegments("/api")
            || path.StartsWithSegments("/openapi")
            || path.StartsWithSegments("/scalar"))
        {
            return null;
        }

        if (!hasQuery && TryPrerenderedFile(files, path, out var prerendered))
        {
            return prerendered;
        }

        if (files.GetFileInfo(SpaFallbackFile).Exists)
        {
            return SpaFallbackFile;
        }

        return files.GetFileInfo("index.html").Exists ? "index.html" : null;
    }

    private static bool TryPrerenderedFile(IFileProvider files, PathString path, out string relative)
    {
        var route = (path.Value ?? "/").Trim('/');
        if (route.Contains('\\')
            || route.Contains("..", StringComparison.Ordinal)
            || route.Contains('.'))
        {
            relative = "";
            return false;
        }

        relative = route.Length == 0 ? "index.html" : $"{route}/index.html";
        var file = files.GetFileInfo(relative);
        return file.Exists && !file.IsDirectory;
    }
}

internal sealed class HtmlHidingFileProvider(IFileProvider inner) : IFileProvider
{
    public IDirectoryContents GetDirectoryContents(string subpath) => inner.GetDirectoryContents(subpath);

    public IFileInfo GetFileInfo(string subpath) =>
        subpath.EndsWith(".html", StringComparison.OrdinalIgnoreCase)
            ? new NotFoundFileInfo(subpath)
            : inner.GetFileInfo(subpath);

    public IChangeToken Watch(string filter) => inner.Watch(filter);
}
