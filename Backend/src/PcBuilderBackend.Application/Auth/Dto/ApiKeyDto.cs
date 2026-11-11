namespace PcBuilderBackend.Application.Auth.Dto;

public record ApiKeyDto(
    Guid Id,
    string Name,
    string Prefix,
    DateTime? ExpiresAtUtc,
    DateTime CreatedAtUtc,
    DateTime? RevokedAtUtc,
    Guid CreatedByUserId);

public record IssuedApiKeyDto(
    Guid Id,
    string Name,
    string Key,
    string Prefix,
    DateTime? ExpiresAtUtc,
    DateTime CreatedAtUtc,
    Guid CreatedByUserId);

public record AuthenticatedApiKey(Guid ApiKeyId, Guid CreatedByUserId);
