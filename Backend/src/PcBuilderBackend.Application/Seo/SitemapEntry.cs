namespace PcBuilderBackend.Application.Seo;

public sealed record SitemapEntry(string Path, DateTime? LastModifiedUtc = null);
