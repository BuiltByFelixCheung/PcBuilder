using PcBuilderBackend.Application.Auth;
using PcBuilderBackend.Application.Common.Options;

namespace PcBuilderBackend.Api.Auth;

internal static class RefreshTokenCookies
{
    public const string Name = "refreshToken";

    public static void Set(HttpRequest request, HttpResponse response, string token, JwtOptions jwt)
    {
        response.Cookies.Append(Name, token, CreateOptions(request, jwt));
    }

    public static void Delete(HttpRequest request, HttpResponse response, JwtOptions jwt)
    {
        response.Cookies.Delete(Name, CreateOptions(request, jwt));
    }

    public static string? Read(HttpRequest request) => request.Cookies[Name];

    private static CookieOptions CreateOptions(HttpRequest request, JwtOptions jwt) =>
        RefreshCookieSecurity.RequiresSecure(request.IsHttps)
            ? CreateSecureOptions(jwt)
            : CreateClearTextPreviewOptions(jwt);

    private static CookieOptions CreateSecureOptions(JwtOptions jwt) => new()
    {
        HttpOnly = true,
        Secure = true,
        SameSite = SameSiteMode.Lax,
        Path = "/api/auth",
        Expires = DateTimeOffset.UtcNow.AddDays(jwt.RefreshTokenDays)
    };

    // Clear-text local / Dokploy http preview cannot store a Secure cookie, so a full
    // page load would fail to restore the session. Production HTTPS (including hosts
    // behind UseForwardedHeaders) always uses CreateSecureOptions above.
    private static CookieOptions CreateClearTextPreviewOptions(JwtOptions jwt) => new() // NOSONAR S2092
    {
        HttpOnly = true,
        SameSite = SameSiteMode.Lax,
        Path = "/api/auth",
        Expires = DateTimeOffset.UtcNow.AddDays(jwt.RefreshTokenDays)
    };
}
