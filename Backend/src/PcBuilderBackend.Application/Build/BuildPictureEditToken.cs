using System.Security.Cryptography;
using System.Text;

namespace PcBuilderBackend.Application.Build;

public static class BuildPictureEditToken
{
    public static (string Token, string Hash) Create()
    {
        var token = Base64Url(RandomNumberGenerator.GetBytes(32));
        return (token, Hash(token));
    }

    public static bool Matches(string? hash, string? token)
    {
        if (string.IsNullOrEmpty(hash) || string.IsNullOrEmpty(token) || token.Length > 128)
            return false;

        var computed = Encoding.UTF8.GetBytes(Hash(token));
        var stored = Encoding.UTF8.GetBytes(hash);
        return computed.Length == stored.Length
            && CryptographicOperations.FixedTimeEquals(computed, stored);
    }

    private static string Hash(string token)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(token));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }

    private static string Base64Url(byte[] bytes) =>
        Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');
}
