using MediatR;

namespace PcBuilderBackend.Application.Auth.Commands.RevokeApiKey;

public record RevokeApiKeyCommand(Guid Id) : IRequest<bool>;
