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

    private static CookieOptions CreateOptions(HttpRequest request, JwtOptions jwt) => new()
    {
        HttpOnly = true,
        // An http preview never stores a Secure cookie, so a full page load of a
        // shared build link could not restore the session.
        Secure = request.IsHttps,
        SameSite = SameSiteMode.Lax,
        Path = "/api/auth",
        Expires = DateTimeOffset.UtcNow.AddDays(jwt.RefreshTokenDays)
    };
}
