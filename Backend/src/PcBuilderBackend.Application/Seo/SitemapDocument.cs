using System.Globalization;
using System.Text;
using System.Xml;

namespace PcBuilderBackend.Application.Seo;

public static class SitemapDocument
{
    private const string Namespace = "http://www.sitemaps.org/schemas/sitemap/0.9";

    public static string Write(string publicBaseUrl, IReadOnlyList<SitemapEntry> entries)
    {
        var baseUrl = publicBaseUrl.TrimEnd('/');
        var settings = new XmlWriterSettings
        {
            Encoding = new UTF8Encoding(encoderShouldEmitUTF8Identifier: false),
            OmitXmlDeclaration = false,
            Indent = false,
        };

        using var stream = new MemoryStream();
        using (var writer = XmlWriter.Create(stream, settings))
        {
            writer.WriteStartDocument();
            writer.WriteStartElement("urlset", Namespace);
            foreach (var entry in entries)
            {
                writer.WriteStartElement("url", Namespace);
                writer.WriteElementString("loc", Namespace, baseUrl + entry.Path);
                if (entry.LastModifiedUtc is { } lastModified)
                    writer.WriteElementString("lastmod", Namespace, FormatLastModified(lastModified));
                writer.WriteEndElement();
            }

            writer.WriteEndElement();
            writer.WriteEndDocument();
        }

        return Encoding.UTF8.GetString(stream.ToArray());
    }

    private static string FormatLastModified(DateTime value)
    {
        var utc = value.Kind switch
        {
            DateTimeKind.Utc => value,
            DateTimeKind.Local => value.ToUniversalTime(),
            _ => DateTime.SpecifyKind(value, DateTimeKind.Utc),
        };
        return utc.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
    }
}
