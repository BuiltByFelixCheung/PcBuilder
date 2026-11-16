using MediatR;
using PcBuilderBackend.Application.Common.Interfaces;
using PcBuilderBackend.Application.Common.Options;

namespace PcBuilderBackend.Application.Seo.Queries.GetSitemap;

public class GetSitemapHandler(
    ISitemapReadStore store,
    ICacheService cache,
    AppOptions appOptions) : IRequestHandler<GetSitemapQuery, string>
{
    private static readonly TimeSpan CacheLifetime = TimeSpan.FromMinutes(10);

    public Task<string> Handle(GetSitemapQuery request, CancellationToken cancellationToken)
    {
        var baseUrl = appOptions.PublicBaseUrl.TrimEnd('/');
        return cache.GetOrSetAsync(
            $"seo:sitemap:{baseUrl}",
            async token => SitemapDocument.Write(baseUrl, await store.ListAsync(token)),
            CacheLifetime,
            cancellationToken);
    }
}
