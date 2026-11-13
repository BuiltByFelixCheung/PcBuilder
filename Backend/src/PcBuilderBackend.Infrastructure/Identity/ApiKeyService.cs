using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using PcBuilderBackend.Application.Auth.Dto;
using PcBuilderBackend.Application.Common.Interfaces;
using PcBuilderBackend.Infrastructure.Persistence.Identity;

namespace PcBuilderBackend.Infrastructure.Identity;

public class ApiKeyService(ApplicationIdentityDbContext db, ILogger<ApiKeyService> logger) : IApiKeyService
{
    public async Task<IssuedApiKeyDto> CreateAsync(
        Guid createdByUserId,
        string name,
        DateTime? expiresAtUtc,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("API key name is required.", nameof(name));

        var raw = ApiKeyToken.CreateRaw();
        var entity = new ApiKey
        {
            Id = Guid.NewGuid(),
            Name = name.Trim(),
            TokenHash = ApiKeyToken.Hash(raw),
            Prefix = ApiKeyToken.DisplayPrefix(raw),
            ExpiresAtUtc = NormalizeUtc(expiresAtUtc),
            CreatedAtUtc = DateTime.UtcNow,
            CreatedByUserId = createdByUserId
        };

        db.ApiKeys.Add(entity);
        await db.SaveChangesAsync(cancellationToken);
        IdentityLog.ApiKeyCreated(logger, entity.Id, createdByUserId);

        return new IssuedApiKeyDto(
            entity.Id,
            entity.Name,
            raw,
            entity.Prefix,
            entity.ExpiresAtUtc,
            entity.CreatedAtUtc,
            entity.CreatedByUserId);
    }

    public async Task<AuthenticatedApiKey?> AuthenticateAsync(string rawKey, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(rawKey)
            || rawKey.Length > ApiKeyToken.MaxRawLength
            || !rawKey.StartsWith(ApiKeyToken.Prefix, StringComparison.Ordinal))
            return null;

        var hash = ApiKeyToken.Hash(rawKey);
        var key = await db.ApiKeys.SingleOrDefaultAsync(candidate => candidate.TokenHash == hash, cancellationToken);
        if (key is null || !IsActive(key, DateTime.UtcNow))
            return null;

        return new AuthenticatedApiKey(key.Id, key.CreatedByUserId);
    }

    public async Task<IReadOnlyList<ApiKeyDto>> ListAsync(CancellationToken cancellationToken)
    {
        var keys = await db.ApiKeys
            .AsNoTracking()
            .OrderByDescending(key => key.CreatedAtUtc)
            .Select(key => new ApiKeyDto(
                key.Id,
                key.Name,
                key.Prefix,
                key.ExpiresAtUtc,
                key.CreatedAtUtc,
                key.RevokedAtUtc,
                key.CreatedByUserId))
            .ToListAsync(cancellationToken);

        return keys;
    }

    public async Task<bool> RevokeAsync(Guid id, CancellationToken cancellationToken)
    {
        var key = await db.ApiKeys.SingleOrDefaultAsync(candidate => candidate.Id == id, cancellationToken);
        if (key is null)
            return false;

        if (key.RevokedAtUtc is null)
        {
            key.RevokedAtUtc = DateTime.UtcNow;
            await db.SaveChangesAsync(cancellationToken);
            IdentityLog.ApiKeyRevoked(logger, key.Id);
        }

        return true;
    }

    private static bool IsActive(ApiKey key, DateTime utcNow) =>
        key.RevokedAtUtc is null && (key.ExpiresAtUtc is null || key.ExpiresAtUtc > utcNow);

    private static DateTime? NormalizeUtc(DateTime? value) =>
        value is null ? null : NormalizeUtc(value.Value);

    private static DateTime NormalizeUtc(DateTime value) => value.Kind switch
    {
        DateTimeKind.Utc => value,
        DateTimeKind.Local => value.ToUniversalTime(),
        _ => DateTime.SpecifyKind(value, DateTimeKind.Utc)
    };
}
