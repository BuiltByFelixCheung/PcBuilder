namespace PcBuilderBackend.Application.Seo;

public static class RobotsText
{
    public static string Write(string publicBaseUrl)
    {
        var baseUrl = publicBaseUrl.TrimEnd('/');
        return
            $"""
            User-agent: *
            Allow: /
            Disallow: /api/
            Disallow: /master-data/
            Disallow: /account
            Disallow: /change-password
            Disallow: /login
            Disallow: /register
            Disallow: /forgot-password
            Disallow: /reset-password
            Disallow: /builds/me
            Disallow: /builds/current

            Sitemap: {baseUrl}/sitemap.xml
            """;
    }
}
