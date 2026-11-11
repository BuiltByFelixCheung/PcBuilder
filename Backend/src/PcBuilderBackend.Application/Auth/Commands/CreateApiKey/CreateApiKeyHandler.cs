using MediatR;
using PcBuilderBackend.Application.Auth.Dto;
using PcBuilderBackend.Application.Common.Interfaces;

namespace PcBuilderBackend.Application.Auth.Commands.CreateApiKey;

public class CreateApiKeyHandler(IApiKeyService apiKeys, ICurrentUser currentUser)
    : IRequestHandler<CreateApiKeyCommand, IssuedApiKeyDto>
{
    public Task<IssuedApiKeyDto> Handle(CreateApiKeyCommand request, CancellationToken cancellationToken)
    {
        if (currentUser.UserId is not { } userId)
            throw new UnauthorizedAccessException("An admin user is required to create an API key.");

        return apiKeys.CreateAsync(userId, request.Name, request.ExpiresAtUtc, cancellationToken);
    }
}
