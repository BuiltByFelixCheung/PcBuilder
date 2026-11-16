using System.Net;
using System.Text;
using System.Text.RegularExpressions;

namespace PcBuilderBackend.Application.Seo;

public static partial class SpaShell
{
    public static string Apply(string template, SpaPage page, string publicBaseUrl)
    {
        var html = ReplaceOrInsert(template, TitlePattern(), $"<title>{Encode(page.Title)}</title>");
        html = ReplaceOrInsert(
            html,
            DescriptionPattern(),
            $"""<meta name="description" content="{Encode(page.Description)}" />""");
        html = InsertBeforeHead(html, Head(page, publicBaseUrl));

        if (string.IsNullOrEmpty(page.Heading))
            return html;

        var body = Body(page);
        return RootPattern().IsMatch(html)
            ? RootPattern().Replace(html, _ => body, 1)
            : html;
    }

    public static string NotFoundDocument(SpaPage page)
    {
        var back = page.Links.Count > 0 ? page.Links[0] : null;
        var backLink = back is null
            ? ""
            : $"""<p><a href="{Encode(back.Path)}">{Encode(back.Name)}</a></p>""";

        return "<!doctype html>\n"
            + "<html lang=\"en\">\n"
            + "<head>\n"
            + "<meta charset=\"utf-8\" />\n"
            + $"<title>{Encode(page.Title)}</title>\n"
            + $"""<meta name="description" content="{Encode(page.Description)}" />"""
            + "\n<meta name=\"robots\" content=\"noindex,nofollow\" />\n"
            + "</head>\n"
            + "<body>\n"
            + $"<h1>{Encode(page.Heading)}</h1>\n"
            + backLink
            + "\n</body>\n"
            + "</html>\n";
    }

    private static string Head(SpaPage page, string publicBaseUrl)
    {
        var canonical = SpaUrls.Absolute(publicBaseUrl, page.CanonicalPath);
        var head = new StringBuilder();
        head.Append($"""<link rel="canonical" href="{Encode(canonical)}" />""");
        head.Append($"""<meta name="robots" content="{Encode(page.Robots)}" />""");
        if (!string.IsNullOrEmpty(page.JsonLd))
        {
            head.Append("""<script id="page-jsonld" type="application/ld+json">""");
            head.Append(page.JsonLd);
            head.Append("</script>");
        }

        return head.ToString();
    }

    private static string Body(SpaPage page)
    {
        var body = new StringBuilder();
        body.Append("<div id=\"root\"><h1>");
        body.Append(Encode(page.Heading));
        body.Append("</h1>");
        if (!string.IsNullOrEmpty(page.Summary))
        {
            body.Append("<p>");
            body.Append(Encode(page.Summary));
            body.Append("</p>");
        }

        if (page.Links.Count > 0)
        {
            body.Append("<ul>");
            foreach (var link in page.Links)
            {
                body.Append("<li><a href=\"");
                body.Append(Encode(link.Path));
                body.Append("\">");
                body.Append(Encode(link.Name));
                body.Append("</a></li>");
            }

            body.Append("</ul>");
        }

        body.Append("</div>");
        return body.ToString();
    }

    private static string ReplaceOrInsert(string html, Regex pattern, string replacement)
    {
        return pattern.IsMatch(html)
            ? pattern.Replace(html, _ => replacement, 1)
            : InsertBeforeHead(html, replacement);
    }

    private static string InsertBeforeHead(string html, string fragment)
    {
        var index = html.LastIndexOf("</head>", StringComparison.OrdinalIgnoreCase);
        return index < 0 ? html : html.Insert(index, fragment);
    }

    private static string Encode(string value) => WebUtility.HtmlEncode(value);

    [GeneratedRegex("<title>.*?</title>", RegexOptions.IgnoreCase | RegexOptions.Singleline | RegexOptions.CultureInvariant)]
    private static partial Regex TitlePattern();

    [GeneratedRegex(
        """<meta\b[^>]*\bname\s*=\s*["']description["'][^>]*>""",
        RegexOptions.IgnoreCase | RegexOptions.Singleline | RegexOptions.CultureInvariant)]
    private static partial Regex DescriptionPattern();

    [GeneratedRegex(
        """<div\b[^>]*\bid\s*=\s*["']root["'][^>]*>\s*</div>""",
        RegexOptions.IgnoreCase | RegexOptions.Singleline | RegexOptions.CultureInvariant)]
    private static partial Regex RootPattern();
}
