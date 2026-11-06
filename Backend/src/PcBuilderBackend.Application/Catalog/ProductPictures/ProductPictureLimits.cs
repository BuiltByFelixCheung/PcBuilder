namespace PcBuilderBackend.Application.Catalog.ProductPictures;

public static class ProductPictureLimits
{
    public const long MaxBytes = 5 * 1024 * 1024;

    private static readonly Dictionary<string, string> ContentTypesByExtension =
        new(StringComparer.OrdinalIgnoreCase)
        {
            [".jpg"] = "image/jpeg",
            [".jpeg"] = "image/jpeg",
            [".png"] = "image/png",
            [".webp"] = "image/webp",
            [".gif"] = "image/gif"
        };

    public static bool IsAllowedImage(string? fileName, string? contentType)
    {
        if (string.IsNullOrWhiteSpace(fileName) || string.IsNullOrWhiteSpace(contentType))
            return false;

        var extension = Path.GetExtension(fileName);
        if (!ContentTypesByExtension.TryGetValue(extension, out var expected))
            return false;

        var mediaType = contentType.Split(';', 2)[0].Trim();
        return string.Equals(expected, mediaType, StringComparison.OrdinalIgnoreCase);
    }
}
