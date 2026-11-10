namespace PcBuilderBackend.Application.Auth;

/// <summary>
/// Decides whether the refresh cookie must carry the Secure flag.
/// HTTPS (including after X-Forwarded-Proto is applied) always requires it;
/// clear-text local and http preview hosts must leave it unset so the browser
/// can store the cookie across a full page load.
/// </summary>
public static class RefreshCookieSecurity
{
    public static bool RequiresSecure(bool isHttps) => isHttps;
}
