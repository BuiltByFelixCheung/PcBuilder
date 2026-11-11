using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Options;
using PcBuilderBackend.Api.Extensions;

namespace PcBuilderBackend.Api.Auth;

public sealed class BearerOrApiKeyAuthenticationHandler(
    IOptionsMonitor<AuthenticationSchemeOptions> options,
    ILoggerFactory logger,
    UrlEncoder encoder)
    : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
    protected override async Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        if (AuthenticationExtensions.HasBearerCredential(Request))
        {
            var jwt = await Context.AuthenticateAsync(JwtBearerDefaults.AuthenticationScheme);
            if (jwt.Succeeded || !AuthenticationExtensions.HasApiKeyHeader(Request))
                return jwt;

            var apiKey = await Context.AuthenticateAsync(ApiKeyAuthenticationDefaults.AuthenticationScheme);
            if (apiKey.Succeeded)
                return apiKey;

            return jwt.Failure is not null ? jwt : apiKey;
        }

        if (AuthenticationExtensions.HasApiKeyHeader(Request))
            return await Context.AuthenticateAsync(ApiKeyAuthenticationDefaults.AuthenticationScheme);

        return AuthenticateResult.NoResult();
    }

    protected override Task HandleChallengeAsync(AuthenticationProperties? properties) =>
        Context.ChallengeAsync(AuthenticationExtensions.SelectScheme(Context), properties);

    protected override Task HandleForbiddenAsync(AuthenticationProperties? properties) =>
        Context.ForbidAsync(AuthenticationExtensions.SelectScheme(Context), properties);
}
