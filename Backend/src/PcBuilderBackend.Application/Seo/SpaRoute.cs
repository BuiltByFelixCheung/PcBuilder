using PcBuilderBackend.Domain.Enums;

namespace PcBuilderBackend.Application.Seo;

public enum SpaRouteKind
{
    Other,
    Private,
    Home,
    CatalogList,
    CatalogDetail,
    BuildList,
    BuildDetail,
    NotFound,
}

public sealed record SpaCatalogSection(string Key, string Label, ProductType ProductType);

public static class SpaCatalog
{
    public static readonly IReadOnlyList<SpaCatalogSection> Sections =
    [
        new("chassis", "Chassis", ProductType.Chassis),
        new("motherboards", "Motherboards", ProductType.Motherboard),
        new("cpus", "CPUs", ProductType.Cpu),
        new("graphics-cards", "Graphics Cards", ProductType.GraphicsCard),
        new("memories", "Memory", ProductType.Ram),
        new("storage", "Storage", ProductType.StorageDrive),
        new("psus", "PSUs", ProductType.Psu),
        new("cpu-coolers", "CPU Coolers", ProductType.CpuCooler),
        new("chassis-fans", "Chassis Fans", ProductType.ChassisFan),
        new("wired-network-adapters", "Wired Network Adapters", ProductType.WiredNetworkAdapter),
        new("wireless-network-adapters", "Wireless Network Adapters", ProductType.WirelessNetworkAdapter),
    ];

    public static SpaCatalogSection? Find(string key) =>
        Sections.FirstOrDefault(section =>
            string.Equals(section.Key, key, StringComparison.OrdinalIgnoreCase));
}

public sealed record SpaRoute(
    SpaRouteKind Kind,
    string Path,
    SpaCatalogSection? Section = null,
    Guid? Id = null);

public static class SpaRoutes
{
    public const string BuildsPath = "/builds";
    private const string BuildsPrefix = "/builds/";
    private const string CatalogPrefix = "/catalog/";

    private static readonly HashSet<string> PrivateExact = new(StringComparer.Ordinal)
    {
        "/login",
        "/register",
        "/forgot-password",
        "/reset-password",
        "/account",
        "/change-password",
        "/builds/me",
        "/builds/current",
    };

    public static string Normalize(string? requestPath)
    {
        if (string.IsNullOrWhiteSpace(requestPath))
            return "/";

        var path = requestPath.Trim();
        if (!path.StartsWith('/'))
            path = string.Concat('/', path);

        if (path.Length > 1)
            path = path.TrimEnd('/');

        return path.ToLowerInvariant();
    }

    public static SpaRoute Match(string? requestPath)
    {
        var path = Normalize(requestPath);
        if (path == "/")
            return new SpaRoute(SpaRouteKind.Home, "/");

        if (IsPrivate(path))
            return new SpaRoute(SpaRouteKind.Private, path);

        if (path == BuildsPath)
            return new SpaRoute(SpaRouteKind.BuildList, BuildsPath);

        if (path.StartsWith(BuildsPrefix, StringComparison.Ordinal))
            return Build(path);

        if (!path.StartsWith(CatalogPrefix, StringComparison.Ordinal))
            return new SpaRoute(SpaRouteKind.Other, path);

        return Catalog(path);
    }

    private static bool IsPrivate(string path)
    {
        if (PrivateExact.Contains(path))
            return true;

        if (path == "/master-data" || path.StartsWith("/master-data/", StringComparison.Ordinal))
            return true;

        if (path.StartsWith(CatalogPrefix, StringComparison.Ordinal)
            && path.EndsWith("/new", StringComparison.Ordinal))
        {
            var section = path[CatalogPrefix.Length..^"/new".Length];
            return section.Length > 0 && !section.Contains('/');
        }

        if (path.StartsWith(BuildsPrefix, StringComparison.Ordinal)
            && path.EndsWith("/edit", StringComparison.Ordinal))
        {
            var id = path[BuildsPrefix.Length..^"/edit".Length];
            return id.Length > 0 && !id.Contains('/');
        }

        return false;
    }

    private static SpaRoute Build(string path)
    {
        var idPart = path[BuildsPrefix.Length..];
        if (idPart.Contains('/'))
            return new SpaRoute(SpaRouteKind.Other, path);

        return Guid.TryParse(idPart, out var id)
            ? new SpaRoute(SpaRouteKind.BuildDetail, $"{BuildsPath}/{id:D}", Id: id)
            : new SpaRoute(SpaRouteKind.NotFound, path);
    }

    private static SpaRoute Catalog(string path)
    {
        var rest = path[CatalogPrefix.Length..];
        var slash = rest.IndexOf('/');
        var key = slash < 0 ? rest : rest[..slash];
        var section = SpaCatalog.Find(key);
        if (section is null)
            return new SpaRoute(SpaRouteKind.Other, path);

        var listPath = $"/catalog/{section.Key}";
        if (slash < 0)
            return new SpaRoute(SpaRouteKind.CatalogList, listPath, section);

        var idPart = rest[(slash + 1)..];
        if (idPart.Contains('/'))
            return new SpaRoute(SpaRouteKind.Other, path);

        return Guid.TryParse(idPart, out var id)
            ? new SpaRoute(SpaRouteKind.CatalogDetail, $"{listPath}/{id:D}", section, id)
            : new SpaRoute(SpaRouteKind.NotFound, $"{listPath}/{idPart}", section);
    }
}
