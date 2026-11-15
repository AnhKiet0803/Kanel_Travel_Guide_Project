using System.Security.Cryptography;
using System.Text;

namespace KanelTravelGuide_BE.Services;

public static class PasswordResetTokens
{
    public const string Subject = "Reset your Karnel Travel Guide password";
    public static readonly TimeSpan Lifetime = TimeSpan.FromHours(1);

    public static string Create()
    {
        return Convert.ToBase64String(RandomNumberGenerator.GetBytes(32))
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');
    }

    public static string Hash(string token)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(token));
        return Convert.ToHexString(bytes);
    }

    public static string HashLine(string token) => $"TokenHash: {Hash(token)}";
}
