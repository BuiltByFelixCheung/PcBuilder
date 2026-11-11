using MediatR;
using PcBuilderBackend.Application.Common.Interfaces;

namespace PcBuilderBackend.Application.Auth.Commands.RevokeApiKey;

public class RevokeApiKeyHandler(IApiKeyService apiKeys) : IRequestHandler<RevokeApiKeyCommand, bool>
{
    public Task<bool> Handle(RevokeApiKeyCommand request, CancellationToken cancellationToken) =>
        apiKeys.RevokeAsync(request.Id, cancellationToken);
}
