using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;
using PcBuilderBackend.Application.Common.Authorization;
using PcBuilderBackend.Application.Common.Interfaces;

namespace PcBuilderBackend.Api.Auth;

public static class ApiKeyAuthenticationDefaults
{
    public const string AuthenticationScheme = "ApiKey";
    public const string HeaderName = "X-Api-Key";
}

public sealed class ApiKeyAuthenticationHandler(
    IOptionsMonitor<AuthenticationSchemeOptions> options,
    ILoggerFactory logger,
    UrlEncoder encoder,
    IApiKeyService apiKeys)
    : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
    protected override async Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        if (!Request.Headers.TryGetValue(ApiKeyAuthenticationDefaults.HeaderName, out var values))
            return AuthenticateResult.NoResult();

        var raw = values.ToString();
        if (string.IsNullOrWhiteSpace(raw))
            return AuthenticateResult.Fail("API key is missing.");

        var match = await apiKeys.AuthenticateAsync(raw, Context.RequestAborted);
        if (match is null)
            return AuthenticateResult.Fail("API key is invalid.");

        var claims = new[]
        {
            new Claim(ClaimTypes.Role, AuthRoles.Importer),
            new Claim("api_key_id", match.ApiKeyId.ToString())
        };
        var identity = new ClaimsIdentity(claims, Scheme.Name);
        var ticket = new AuthenticationTicket(new ClaimsPrincipal(identity), Scheme.Name);
        return AuthenticateResult.Success(ticket);
    }
}
