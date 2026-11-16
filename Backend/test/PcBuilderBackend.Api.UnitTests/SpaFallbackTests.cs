using FluentAssertions;
using Microsoft.Extensions.FileProviders;
using PcBuilderBackend.Api.Extensions;

namespace PcBuilderBackend.Api.UnitTests;

public sealed class SpaFallbackTests : IDisposable
{
    private readonly string _root = Path.Combine(Path.GetTempPath(), "spa-fallback-" + Guid.NewGuid().ToString("N"));
    private readonly PhysicalFileProvider _files;

    public SpaFallbackTests()
    {
        Directory.CreateDirectory(Path.Combine(_root, "catalog", "cpus"));
        File.WriteAllText(Path.Combine(_root, "index.html"), "home");
        File.WriteAllText(Path.Combine(_root, "favicon.svg"), "<svg />");
        File.WriteAllText(Path.Combine(_root, "__spa-fallback.html"), "shell");
        File.WriteAllText(Path.Combine(_root, "catalog", "cpus", "index.html"), "cpus");
        _files = new PhysicalFileProvider(_root);
    }

    [Theory]
    [InlineData("/", false, "index.html")]
    [InlineData("/catalog/cpus", false, "catalog/cpus/index.html")]
    [InlineData("/catalog/cpus/", false, "catalog/cpus/index.html")]
    [InlineData("/catalog/cpus", true, "__spa-fallback.html")]
    [InlineData("/catalog/cpus/abc", false, "__spa-fallback.html")]
    [InlineData("/builds/current", false, "__spa-fallback.html")]
    [InlineData("/catalog/cpus/index.html", false, "__spa-fallback.html")]
    public void Resolves_prerendered_html_or_the_shell(string path, bool hasQuery, string expected)
    {
        SpaFallbackExtensions.ResolveSpaFile(_files, path, hasQuery).Should().Be(expected);
    }

    [Theory]
    [InlineData("/api/catalog/cpus")]
    [InlineData("/openapi/v1.json")]
    [InlineData("/scalar")]
    public void Api_paths_are_not_html(string path)
    {
        SpaFallbackExtensions.ResolveSpaFile(_files, path, false).Should().BeNull();
    }

    [Fact]
    public void Static_files_do_not_serve_html()
    {
        var hidden = new HtmlHidingFileProvider(_files);
        hidden.GetFileInfo("favicon.svg").Exists.Should().BeTrue();
        hidden.GetFileInfo("index.html").Exists.Should().BeFalse();
        hidden.GetFileInfo("catalog/cpus/index.html").Exists.Should().BeFalse();
    }

    public void Dispose()
    {
        _files.Dispose();
        Directory.Delete(_root, recursive: true);
    }
}
