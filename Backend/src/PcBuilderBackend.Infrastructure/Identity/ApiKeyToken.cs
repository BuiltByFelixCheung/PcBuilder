using System.Security.Cryptography;
using System.Text;

namespace PcBuilderBackend.Infrastructure.Identity;

internal static class ApiKeyToken
{
    public const string Prefix = "pcb_";
    public const int DisplayPrefixLength = 12;
    public const int MaxRawLength = 128;

    public static string CreateRaw()
    {
        var secret = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32))
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');
        return Prefix + secret;
    }

    public static string DisplayPrefix(string rawKey) => rawKey[..DisplayPrefixLength];

    public static string Hash(string rawKey)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(rawKey));
        return Convert.ToHexString(bytes);
    }
}
