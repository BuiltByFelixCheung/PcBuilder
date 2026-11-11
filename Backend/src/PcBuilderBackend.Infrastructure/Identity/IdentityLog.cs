using Microsoft.Extensions.Logging;

namespace PcBuilderBackend.Infrastructure.Identity;

internal static partial class IdentityLog
{
    [LoggerMessage(EventId = 3001, Level = LogLevel.Information, Message = "Registered Member {UserId} ({Email}).")]
    public static partial void Registered(ILogger logger, Guid userId, string email);

    [LoggerMessage(EventId = 3002, Level = LogLevel.Information, Message = "User {UserId} signed in.")]
    public static partial void SignedIn(ILogger logger, Guid userId);

    [LoggerMessage(EventId = 3003, Level = LogLevel.Warning, Message = "Failed sign-in for {Email}.")]
    public static partial void SignInFailed(ILogger logger, string email);

    [LoggerMessage(EventId = 3004, Level = LogLevel.Warning, Message = "Locked out sign-in for {Email}.")]
    public static partial void SignInLockedOut(ILogger logger, string email);

    [LoggerMessage(EventId = 3005, Level = LogLevel.Warning, Message = "Refresh token reuse detected for user {UserId}; family revoked.")]
    public static partial void RefreshTokenReuse(ILogger logger, Guid userId);

    [LoggerMessage(EventId = 3006, Level = LogLevel.Information, Message = "Seeded identity roles.")]
    public static partial void RolesSeeded(ILogger logger);

    [LoggerMessage(EventId = 3007, Level = LogLevel.Information, Message = "Seeded admin user {Email}.")]
    public static partial void AdminSeeded(ILogger logger, string email);

    [LoggerMessage(EventId = 3008, Level = LogLevel.Warning, Message = "Admin seed skipped: Admin:Email or Admin:Password is not configured.")]
    public static partial void AdminSeedSkipped(ILogger logger);

    [LoggerMessage(EventId = 3009, Level = LogLevel.Error, Message = "Failed to seed admin user {Email}: {Errors}")]
    public static partial void AdminSeedFailed(ILogger logger, string email, string errors);

    [LoggerMessage(EventId = 3010, Level = LogLevel.Information, Message = "Password reset requested for user {UserId}.")]
    public static partial void PasswordResetRequested(ILogger logger, Guid userId);

    [LoggerMessage(EventId = 3011, Level = LogLevel.Information, Message = "Password reset requested for unknown email {Email}.")]
    public static partial void PasswordResetUnknownEmail(ILogger logger, string email);

    [LoggerMessage(EventId = 3012, Level = LogLevel.Warning, Message = "Password reset failed for {Email}.")]
    public static partial void PasswordResetFailed(ILogger logger, string email);

    [LoggerMessage(EventId = 3013, Level = LogLevel.Information, Message = "Password reset completed for user {UserId}.")]
    public static partial void PasswordResetCompleted(ILogger logger, Guid userId);

    [LoggerMessage(EventId = 3014, Level = LogLevel.Information, Message = "Password changed for user {UserId}.")]
    public static partial void PasswordChanged(ILogger logger, Guid userId);

    [LoggerMessage(EventId = 3015, Level = LogLevel.Information, Message = "API key {ApiKeyId} created by user {UserId}.")]
    public static partial void ApiKeyCreated(ILogger logger, Guid apiKeyId, Guid userId);

    [LoggerMessage(EventId = 3016, Level = LogLevel.Information, Message = "API key {ApiKeyId} revoked.")]
    public static partial void ApiKeyRevoked(ILogger logger, Guid apiKeyId);
}
