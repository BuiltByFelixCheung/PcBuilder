namespace PcBuilderBackend.Application.Seo;

public sealed record SpaLink(string Name, string Path);

public sealed record SpaPage(
    string Title,
    string Description,
    string CanonicalPath,
    string Robots,
    string Heading,
    string Summary,
    IReadOnlyList<SpaLink> Links,
    string? JsonLd);

public enum SpaResolution
{
    Passthrough,
    Page,
    NotFound,
}

public sealed record SpaResolutionResult(SpaResolution Status, SpaPage? Page)
{
    public static SpaResolutionResult Passthrough() => new(SpaResolution.Passthrough, null);

    public static SpaResolutionResult Found(SpaPage page) => new(SpaResolution.Page, page);

    public static SpaResolutionResult Missing(SpaPage page) => new(SpaResolution.NotFound, page);
}

/// <summary>
/// English copy matching <c>Frontend/src/i18n/locales/en.json</c>.
/// The client replaces the title and description after it boots.
/// </summary>
public static class SpaCopy
{
    public const string SiteName = "PC Builder";
    public const string HomeDescription = "Browse PC parts and check compatibility before you build.";
    public const string HomeLead =
        "Pick parts, check compatibility, and save a build. Public builds show up on Browse Builds; private ones stay on My builds.";
    public const string CatalogLead =
        "Browse the catalog, then apply filters when you need a narrower set.";
    public const string BuildsLead =
        "Public PC builds shared by members. Open one to inspect the parts list.";
    public const string BrowseBuilds = "Browse builds";
    public const string SavedBuild = "Saved build.";
    public const string HomeName = "Home";
    public const string Index = "index,follow";
    public const string NoIndex = "noindex,nofollow";

    public static string Titled(string name) => $"{name} | {SiteName}";

    public static string Product(string name, string? manufacturer, string category)
    {
        var brand = manufacturer?.Trim();
        return string.IsNullOrEmpty(brand)
            ? $"{name}. {category}."
            : $"{name} by {brand}. {category}.";
    }

    public static string NotFound(string category) => $"{category} was not found.";
}

public static class SpaUrls
{
    public static string Absolute(string publicBaseUrl, string path)
    {
        var origin = publicBaseUrl.Trim().TrimEnd('/');
        if (string.IsNullOrEmpty(path) || path == "/")
            return origin + "/";

        return origin + (path.StartsWith('/') ? path : "/" + path);
    }
}
