using FluentAssertions;
using PcBuilderBackend.Application.Seo;

namespace PcBuilderBackend.Application.UnitTests.Seo;

public class SpaShellTests
{
    private const string Origin = "https://pcbuilder.example.com/";
    private static readonly Guid ProductId = Guid.Parse("11111111-1111-1111-1111-111111111111");

    private const string Template = """
        <!doctype html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <meta
              name="description"
              content="Browse PC parts and check compatibility before you build."
            />
            <title>PC Builder</title>
          </head>
          <body>
            <div id="root"></div>
            <script type="module" src="/assets/index.js"></script>
          </body>
        </html>
        """;

    [Fact]
    public void Match_reads_catalog_and_build_urls()
    {
        var list = SpaRoutes.Match("/catalog/cpus/");
        list.Kind.Should().Be(SpaRouteKind.CatalogList);
        list.Path.Should().Be("/catalog/cpus");
        list.Section!.Label.Should().Be("CPUs");

        var detail = SpaRoutes.Match($"/Catalog/CPUs/{ProductId:D}");
        detail.Kind.Should().Be(SpaRouteKind.CatalogDetail);
        detail.Path.Should().Be($"/catalog/cpus/{ProductId:D}");
        detail.Id.Should().Be(ProductId);

        SpaRoutes.Match("/builds").Kind.Should().Be(SpaRouteKind.BuildList);
        SpaRoutes.Match($"/builds/{ProductId:D}").Kind.Should().Be(SpaRouteKind.BuildDetail);
    }

    [Fact]
    public void Match_keeps_private_urls_out_of_the_catalog()
    {
        SpaRoutes.Match("/catalog/cpus/new").Kind.Should().Be(SpaRouteKind.Private);
        SpaRoutes.Match($"/builds/{ProductId:D}/edit").Kind.Should().Be(SpaRouteKind.Private);
        SpaRoutes.Match("/builds/current").Kind.Should().Be(SpaRouteKind.Private);
        SpaRoutes.Match("/master-data/sockets").Kind.Should().Be(SpaRouteKind.Private);
        SpaRoutes.Match("/account").Kind.Should().Be(SpaRouteKind.Private);
    }

    [Fact]
    public void Match_unknown_ids_are_not_found_and_other_paths_pass_through()
    {
        var missing = SpaRoutes.Match("/catalog/cpus/not-a-cpu");
        missing.Kind.Should().Be(SpaRouteKind.NotFound);
        missing.Section!.Key.Should().Be("cpus");

        SpaRoutes.Match("/builds/not-a-build").Kind.Should().Be(SpaRouteKind.NotFound);
        SpaRoutes.Match("/somewhere-else").Kind.Should().Be(SpaRouteKind.Other);
        SpaRoutes.Match("/catalog/not-a-section").Kind.Should().Be(SpaRouteKind.Other);
    }

    [Fact]
    public void Apply_fills_the_shell_for_a_product_and_escapes_markup()
    {
        var cpus = SpaCatalog.Find("cpus");
        cpus.Should().NotBeNull();

        var page = SpaPages.Product(
            cpus!,
            ProductId,
            "Ryzen <script>alert(1)</script>",
            "AMD",
            Guid.Parse("22222222-2222-2222-2222-222222222222"),
            Origin);

        var html = SpaShell.Apply(Template, page, Origin);

        html.Should().Contain("<title>Ryzen &lt;script&gt;alert(1)&lt;/script&gt; | PC Builder</title>");
        html.Should().Contain("content=\"Ryzen &lt;script&gt;alert(1)&lt;/script&gt; by AMD. CPUs.\"");
        html.Should().NotContain("Browse PC parts and check compatibility before you build.");
        html.Should().Contain(
            $"href=\"https://pcbuilder.example.com/catalog/cpus/{ProductId:D}\"");
        html.Should().Contain("content=\"index,follow\"");
        html.Should().Contain("<h1>Ryzen &lt;script&gt;alert(1)&lt;/script&gt;</h1>");
        html.Should().Contain("\"@type\":\"Product\"");
        html.Should().Contain(
            "https://pcbuilder.example.com/api/catalog/pictures/22222222-2222-2222-2222-222222222222/content");
        html.Should().NotContain("<script>alert");
        html.Should().Contain("<script type=\"module\" src=\"/assets/index.js\"></script>");
        html.Should().NotContain("<div id=\"root\"></div>");
    }

    [Fact]
    public void Apply_lists_the_first_page_and_leaves_private_pages_empty()
    {
        var cpus = SpaCatalog.Find("cpus")!;
        var list = SpaPages.CatalogList(
            cpus,
            [new SpaLink("Ryzen 5", $"/catalog/cpus/{ProductId:D}")],
            Origin);
        var listed = SpaShell.Apply(Template, list, Origin);

        listed.Should().Contain("<title>CPUs | PC Builder</title>");
        listed.Should().Contain("<h1>CPUs</h1>");
        listed.Should().Contain($"<a href=\"/catalog/cpus/{ProductId:D}\">Ryzen 5</a>");

        var account = SpaShell.Apply(Template, SpaPages.Private("/account"), Origin);
        account.Should().Contain("content=\"noindex,nofollow\"");
        account.Should().Contain("<div id=\"root\"></div>");
        account.Should().NotContain("<h1>");
    }

    [Fact]
    public void Not_found_document_is_not_the_app_shell()
    {
        var cpus = SpaCatalog.Find("cpus")!;
        var product = SpaShell.NotFoundDocument(SpaPages.MissingProduct(cpus));
        product.Should().Contain("<title>CPUs | PC Builder</title>");
        product.Should().Contain("<h1>CPUs was not found.</h1>");
        product.Should().Contain("<a href=\"/catalog/cpus\">CPUs</a>");
        product.Should().Contain("noindex,nofollow");
        product.Should().NotContain("id=\"root\"");

        var build = SpaShell.NotFoundDocument(SpaPages.MissingBuild());
        build.Should().Contain("<title>PC Builder</title>");
        build.Should().Contain("<h1>build was not found.</h1>");
        build.Should().Contain("<a href=\"/builds\">Browse builds</a>");
    }

    [Fact]
    public void Product_without_a_brand_omits_the_by_line()
    {
        var page = SpaPages.Product(
            SpaCatalog.Find("memories")!,
            ProductId,
            "Fury",
            "  ",
            null,
            Origin);

        page.Description.Should().Be("Fury. Memory.");
        page.JsonLd.Should().NotContain("\"brand\"");
        page.Title.Should().Be("Fury | PC Builder");
    }
}
