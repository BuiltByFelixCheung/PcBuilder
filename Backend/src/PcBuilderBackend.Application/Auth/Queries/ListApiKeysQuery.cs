using MediatR;
using PcBuilderBackend.Application.Auth.Dto;

namespace PcBuilderBackend.Application.Auth.Queries;

public record ListApiKeysQuery : IRequest<IReadOnlyList<ApiKeyDto>>;
