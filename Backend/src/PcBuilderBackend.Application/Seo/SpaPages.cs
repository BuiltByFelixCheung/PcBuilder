using System.Text.Encodings.Web;
using System.Text.Json;

namespace PcBuilderBackend.Application.Seo;

public static class SpaPages
{
    public static SpaPage Home(string publicBaseUrl) => new(
        SpaCopy.SiteName,
        SpaCopy.HomeDescription,
        "/",
        SpaCopy.Index,
        SpaCopy.SiteName,
        SpaCopy.HomeLead,
        [],
        SpaJson.One(SpaJson.Website(publicBaseUrl, SpaCopy.SiteName, SpaCopy.HomeDescription)));

    public static SpaPage Private(string path) => new(
        SpaCopy.SiteName,
        SpaCopy.HomeDescription,
        path,
        SpaCopy.NoIndex,
        "",
        "",
        [],
        null);

    public static SpaPage CatalogList(
        SpaCatalogSection section,
        IReadOnlyList<SpaLink> links,
        string publicBaseUrl)
    {
        var path = $"/catalog/{section.Key}";
        return new SpaPage(
            SpaCopy.Titled(section.Label),
            SpaCopy.CatalogLead,
            path,
            SpaCopy.Index,
            section.Label,
            SpaCopy.CatalogLead,
            links,
            SpaJson.One(SpaJson.Breadcrumb(publicBaseUrl,
            [
                (SpaCopy.HomeName, "/"),
                (section.Label, path),
            ])));
    }

    public static SpaPage Product(
        SpaCatalogSection section,
        Guid id,
        string name,
        string? manufacturer,
        Guid? pictureId,
        string publicBaseUrl)
    {
        var path = $"/catalog/{section.Key}/{id:D}";
        var listPath = $"/catalog/{section.Key}";
        var description = SpaCopy.Product(name, manufacturer, section.Label);
        string? imagePath = pictureId is null
            ? null
            : $"/api/catalog/pictures/{pictureId.Value:D}/content";

        return new SpaPage(
            SpaCopy.Titled(name),
            description,
            path,
            SpaCopy.Index,
            name,
            description,
            [],
            SpaJson.Graph(
                SpaJson.Breadcrumb(publicBaseUrl,
                [
                    (SpaCopy.HomeName, "/"),
                    (section.Label, listPath),
                    (name, path),
                ]),
                SpaJson.Product(publicBaseUrl, name, manufacturer, section.Label, path, imagePath)));
    }

    public static SpaPage MissingProduct(SpaCatalogSection section) => new(
        SpaCopy.Titled(section.Label),
        SpaCopy.NotFound(section.Label),
        $"/catalog/{section.Key}",
        SpaCopy.NoIndex,
        SpaCopy.NotFound(section.Label),
        "",
        [new SpaLink(section.Label, $"/catalog/{section.Key}")],
        null);

    public static SpaPage BuildList(IReadOnlyList<SpaLink> links, string publicBaseUrl) => new(
        SpaCopy.Titled(SpaCopy.BrowseBuilds),
        SpaCopy.BuildsLead,
        "/builds",
        SpaCopy.Index,
        SpaCopy.BrowseBuilds,
        SpaCopy.BuildsLead,
        links,
        SpaJson.One(SpaJson.Breadcrumb(publicBaseUrl,
        [
            (SpaCopy.HomeName, "/"),
            (SpaCopy.BrowseBuilds, "/builds"),
        ])));

    public static SpaPage Build(
        Guid id,
        string name,
        string? description,
        string publicBaseUrl)
    {
        var path = $"/builds/{id:D}";
        var summary = string.IsNullOrWhiteSpace(description)
            ? SpaCopy.SavedBuild
            : description.Trim();

        return new SpaPage(
            SpaCopy.Titled(name),
            summary,
            path,
            SpaCopy.Index,
            name,
            summary,
            [],
            SpaJson.One(SpaJson.Breadcrumb(publicBaseUrl,
            [
                (SpaCopy.HomeName, "/"),
                (SpaCopy.BrowseBuilds, "/builds"),
                (name, path),
            ])));
    }

    public static SpaPage MissingBuild() => new(
        SpaCopy.SiteName,
        SpaCopy.NotFound("build"),
        "/builds",
        SpaCopy.NoIndex,
        SpaCopy.NotFound("build"),
        "",
        [new SpaLink(SpaCopy.BrowseBuilds, "/builds")],
        null);
}

internal static class SpaJson
{
    private static readonly JsonSerializerOptions Options = new()
    {
        Encoder = JavaScriptEncoder.Default,
    };

    public static string One(object node) => Write(node);

    public static string Graph(object first, object second) => Write(new[] { first, second });

    public static Dictionary<string, object?> Website(string publicBaseUrl, string name, string description) =>
        new()
        {
            ["@context"] = "https://schema.org",
            ["@type"] = "WebSite",
            ["name"] = name,
            ["description"] = description,
            ["url"] = SpaUrls.Absolute(publicBaseUrl, "/"),
        };

    public static Dictionary<string, object?> Breadcrumb(
        string publicBaseUrl,
        IReadOnlyList<(string Name, string Path)> items)
    {
        var elements = new List<Dictionary<string, object?>>(items.Count);
        for (var index = 0; index < items.Count; index++)
        {
            var item = items[index];
            elements.Add(new Dictionary<string, object?>
            {
                ["@type"] = "ListItem",
                ["position"] = index + 1,
                ["name"] = item.Name,
                ["item"] = SpaUrls.Absolute(publicBaseUrl, item.Path),
            });
        }

        return new Dictionary<string, object?>
        {
            ["@context"] = "https://schema.org",
            ["@type"] = "BreadcrumbList",
            ["itemListElement"] = elements,
        };
    }

    public static Dictionary<string, object?> Product(
        string publicBaseUrl,
        string name,
        string? manufacturer,
        string category,
        string path,
        string? imagePath)
    {
        var product = new Dictionary<string, object?>
        {
            ["@context"] = "https://schema.org",
            ["@type"] = "Product",
            ["name"] = name,
            ["category"] = category,
            ["url"] = SpaUrls.Absolute(publicBaseUrl, path),
        };

        var brand = manufacturer?.Trim();
        if (!string.IsNullOrEmpty(brand))
        {
            product["brand"] = new Dictionary<string, object?>
            {
                ["@type"] = "Brand",
                ["name"] = brand,
            };
        }

        if (!string.IsNullOrEmpty(imagePath))
            product["image"] = SpaUrls.Absolute(publicBaseUrl, imagePath);

        return product;
    }

    private static string Write(object value)
    {
        var json = JsonSerializer.Serialize(value, Options);
        return json.Replace("<", "\\u003c", StringComparison.Ordinal);
    }
}
