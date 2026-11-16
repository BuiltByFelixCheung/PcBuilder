using System.Text;
using MediatR;
using PcBuilderBackend.Application.Common.Options;
using PcBuilderBackend.Application.Seo;
using PcBuilderBackend.Application.Seo.Queries.GetSitemap;

namespace PcBuilderBackend.Api.Endpoints.Seo;

public static class SeoEndpoints
{
    public static void MapSeoEndpoints(this WebApplication app)
    {
        app.MapGet("/robots.txt", (AppOptions options) =>
                Results.Text(RobotsText.Write(options.PublicBaseUrl), "text/plain", Encoding.UTF8))
            .AllowAnonymous()
            .ExcludeFromDescription();

        app.MapGet("/sitemap.xml", async (IMediator mediator, CancellationToken cancellationToken) =>
            {
                var xml = await mediator.Send(new GetSitemapQuery(), cancellationToken);
                return Results.Text(xml, "application/xml", Encoding.UTF8);
            })
            .AllowAnonymous()
            .ExcludeFromDescription();
    }
}
