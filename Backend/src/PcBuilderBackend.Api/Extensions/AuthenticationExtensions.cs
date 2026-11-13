using System.Text;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.IdentityModel.Tokens;
using PcBuilderBackend.Api.Auth;
using PcBuilderBackend.Application.Common.Authorization;
using PcBuilderBackend.Application.Common.Interfaces;
using PcBuilderBackend.Application.Common.Options;

namespace PcBuilderBackend.Api.Extensions;

public static class AuthenticationExtensions
{
    public const string BearerOrApiKeyScheme = "BearerOrApiKey";

    public static IServiceCollection AddApiAuthentication(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUser, CurrentUser>();

        var jwt = configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>()
                  ?? throw new InvalidOperationException("Jwt configuration section is missing.");
        jwt.Validate();

        services
            .AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = BearerOrApiKeyScheme;
                options.DefaultChallengeScheme = BearerOrApiKeyScheme;
            })
            .AddJwtBearer(JwtBearerDefaults.AuthenticationScheme, options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = jwt.Issuer,
                    ValidAudience = jwt.Audience,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Key)),
                    ClockSkew = TimeSpan.FromSeconds(30),
                    RoleClaimType = System.Security.Claims.ClaimTypes.Role,
                    NameClaimType = System.Security.Claims.ClaimTypes.NameIdentifier
                };
            })
            .AddScheme<AuthenticationSchemeOptions, ApiKeyAuthenticationHandler>(
                ApiKeyAuthenticationDefaults.AuthenticationScheme,
                null)
            .AddScheme<AuthenticationSchemeOptions, BearerOrApiKeyAuthenticationHandler>(
                BearerOrApiKeyScheme,
                "JWT bearer or API key",
                null);

        services.AddAuthorizationBuilder()
            .AddRolePolicy(AuthPolicies.MasterDataWrite)
            .AddRolePolicy(AuthPolicies.CatalogWrite)
            .AddRolePolicy(AuthPolicies.MasterDataImport)
            .AddRolePolicy(AuthPolicies.CatalogImport)
            .AddRolePolicy(AuthPolicies.BuildWrite)
            .AddPolicy(AuthPolicies.ApiKeyManage, policy =>
            {
                policy.AddAuthenticationSchemes(JwtBearerDefaults.AuthenticationScheme);
                policy.RequireRole(AuthPolicyRules.RolesFor(AuthPolicies.ApiKeyManage));
            })
            .AddPolicy(AuthPolicies.Interactive, policy =>
            {
                policy.AddAuthenticationSchemes(JwtBearerDefaults.AuthenticationScheme);
                policy.RequireAuthenticatedUser();
            });

        return services;
    }

    internal static string SelectScheme(HttpContext context)
    {
        if (HasBearerCredential(context.Request))
            return JwtBearerDefaults.AuthenticationScheme;

        if (HasApiKeyHeader(context.Request))
            return ApiKeyAuthenticationDefaults.AuthenticationScheme;

        return JwtBearerDefaults.AuthenticationScheme;
    }

    internal static bool HasBearerCredential(HttpRequest request)
    {
        var authorization = request.Headers.Authorization.ToString();
        const string prefix = "Bearer ";
        return authorization.StartsWith(prefix, StringComparison.OrdinalIgnoreCase)
               && !string.IsNullOrWhiteSpace(authorization[prefix.Length..]);
    }

    internal static bool HasApiKeyHeader(HttpRequest request) =>
        request.Headers.ContainsKey(ApiKeyAuthenticationDefaults.HeaderName);

    private static AuthorizationBuilder AddRolePolicy(this AuthorizationBuilder builder, string policyName) =>
        builder.AddPolicy(policyName, policy => policy.RequireRole(AuthPolicyRules.RolesFor(policyName)));
}
