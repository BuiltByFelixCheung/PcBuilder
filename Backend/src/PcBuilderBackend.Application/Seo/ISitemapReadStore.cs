namespace PcBuilderBackend.Application.Seo;

public interface ISitemapReadStore
{
    Task<IReadOnlyList<SitemapEntry>> ListAsync(CancellationToken cancellationToken);
}
