using MediatR;
using PcBuilderBackend.Application.Auth.Dto;

namespace PcBuilderBackend.Application.Auth.Commands.CreateApiKey;

public record CreateApiKeyCommand(string Name, DateTime? ExpiresAtUtc) : IRequest<IssuedApiKeyDto>;
