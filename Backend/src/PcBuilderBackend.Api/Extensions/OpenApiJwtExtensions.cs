using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.OpenApi;
using Microsoft.OpenApi;
using PcBuilderBackend.Api.Auth;
using PcBuilderBackend.Application.Common.Authorization;

namespace PcBuilderBackend.Api.Extensions;

public static class OpenApiJwtExtensions
{
    public static OpenApiOptions AddJwtBearerSecurity(this OpenApiOptions options)
    {
        options.AddDocumentTransformer((document, _, _) =>
        {
            document.Components ??= new OpenApiComponents();
            document.Components.SecuritySchemes ??= new Dictionary<string, IOpenApiSecurityScheme>();
            document.Components.SecuritySchemes["Bearer"] = new OpenApiSecurityScheme
            {
                Type = SecuritySchemeType.Http,
                Scheme = "bearer",
                BearerFormat = "JWT",
                Description = "JWT Bearer authentication. Paste the access token from POST /api/auth/login."
            };
            document.Components.SecuritySchemes["ApiKey"] = new OpenApiSecurityScheme
            {
                Type = SecuritySchemeType.ApiKey,
                In = ParameterLocation.Header,
                Name = ApiKeyAuthenticationDefaults.HeaderName,
                Description =
                    "Importer API key from POST /api/auth/api-keys. Allows catalog and master-data create and import."
            };
            return Task.CompletedTask;
        });

        options.AddOperationTransformer((operation, context, _) =>
        {
            var authorize = context.Description.ActionDescriptor.EndpointMetadata
                .OfType<IAuthorizeData>()
                .ToList();
            if (authorize.Count == 0)
                return Task.CompletedTask;

            operation.Security ??= [];
            operation.Security.Add(new OpenApiSecurityRequirement
            {
                [new OpenApiSecuritySchemeReference("Bearer", context.Document)] = []
            });

            var allowsApiKey = authorize.Any(data =>
                data.Policy is AuthPolicies.CatalogImport or AuthPolicies.MasterDataImport);
            if (allowsApiKey)
            {
                operation.Security.Add(new OpenApiSecurityRequirement
                {
                    [new OpenApiSecuritySchemeReference("ApiKey", context.Document)] = []
                });
            }

            return Task.CompletedTask;
        });

        return options;
    }
}
