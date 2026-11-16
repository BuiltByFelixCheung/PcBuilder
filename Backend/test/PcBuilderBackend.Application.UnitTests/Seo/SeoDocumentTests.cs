using FluentAssertions;
using PcBuilderBackend.Application.Seo;

namespace PcBuilderBackend.Application.UnitTests.Seo;

public class SeoDocumentTests
{
    [Fact]
    public void Sitemap_writes_absolute_locations_and_only_the_given_entries()
    {
        var id = Guid.Parse("11111111-1111-1111-1111-111111111111");
        var updated = new DateTime(2026, 11, 16, 8, 30, 0, DateTimeKind.Utc);

        var xml = SitemapDocument.Write(
            "https://pcbuilder.example.com/",
            [
                new SitemapEntry("/catalog/cpus"),
                new SitemapEntry($"/catalog/cpus/{id:D}", updated),
            ]);

        xml.Should().Contain("https://pcbuilder.example.com/catalog/cpus</loc>");
        xml.Should().Contain($"https://pcbuilder.example.com/catalog/cpus/{id:D}</loc>");
        xml.Should().Contain("<lastmod>2026-11-16</lastmod>");
        xml.Should().NotContain("/catalog/motherboards");
        xml.Should().NotContain("/builds/");
    }

    [Fact]
    public void Robots_points_at_the_sitemap_and_leaves_the_catalog_crawlable()
    {
        var robots = RobotsText.Write("https://pcbuilder.example.com/");

        robots.Should().Contain("Sitemap: https://pcbuilder.example.com/sitemap.xml");
        robots.Should().Contain("Disallow: /account");
        robots.Should().NotContain("Disallow: /catalog/");
    }
}
