using MediatR;

namespace PcBuilderBackend.Application.Seo.Queries.GetSitemap;

public record GetSitemapQuery : IRequest<string>;
