using PcBuilderBackend.Application.Auth.Dto;

namespace PcBuilderBackend.Application.Common.Interfaces;

public interface IApiKeyService
{
    Task<IssuedApiKeyDto> CreateAsync(
        Guid createdByUserId,
        string name,
        DateTime? expiresAtUtc,
        CancellationToken cancellationToken);

    Task<AuthenticatedApiKey?> AuthenticateAsync(string rawKey, CancellationToken cancellationToken);

    Task<IReadOnlyList<ApiKeyDto>> ListAsync(CancellationToken cancellationToken);

    Task<bool> RevokeAsync(Guid id, CancellationToken cancellationToken);
}
