using Microsoft.AspNetCore.Authorization;
using PcBuilderBackend.Application.Common.Authorization;

namespace PcBuilderBackend.Api.Extensions;

public static class MutationAuthorizationExtensions
{
    public static RouteGroupBuilder RequireMutationAuthorization(
        this RouteGroupBuilder group,
        string writePolicy,
        string importPolicy)
    {
        ((IEndpointConventionBuilder)group).Add(builder =>
        {
            if (builder is not RouteEndpointBuilder endpointBuilder)
                return;

            var http = endpointBuilder.Metadata.OfType<HttpMethodMetadata>().LastOrDefault();
            if (http is null)
                return;

            var policy = MutationAuthorizationRules.PolicyFor(
                http.HttpMethods,
                endpointBuilder.RoutePattern.RawText,
                writePolicy,
                importPolicy);
            if (policy is null)
                return;

            endpointBuilder.Metadata.Add(new AuthorizeAttribute(policy));
        });

        return group;
    }
}
