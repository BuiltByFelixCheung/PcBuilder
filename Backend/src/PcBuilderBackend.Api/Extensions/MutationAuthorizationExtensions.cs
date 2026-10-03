using Microsoft.AspNetCore.Authorization;

namespace PcBuilderBackend.Api.Extensions;

public static class MutationAuthorizationExtensions
{
    public static RouteGroupBuilder RequireMutationAuthorization(this RouteGroupBuilder group, string policy)
    {
        ((IEndpointConventionBuilder)group).Add(builder =>
        {
            if (builder is not RouteEndpointBuilder endpointBuilder)
                return;

            var http = endpointBuilder.Metadata.OfType<HttpMethodMetadata>().LastOrDefault();
            if (http is null)
                return;

            if (http.HttpMethods.Any(method => HttpMethods.IsGet(method)))
                return;

            var route = endpointBuilder.RoutePattern.RawText ?? string.Empty;
            if (IsQueryRoute(route))
                return;

            endpointBuilder.Metadata.Add(new AuthorizeAttribute(policy));
        });

        return group;
    }

    private static bool IsQueryRoute(string route) =>
        route.Equals("query", StringComparison.OrdinalIgnoreCase)
        || route.EndsWith("/query", StringComparison.OrdinalIgnoreCase)
        || route.EndsWith("/query/", StringComparison.OrdinalIgnoreCase);
}
