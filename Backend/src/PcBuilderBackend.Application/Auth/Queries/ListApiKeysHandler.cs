using MediatR;
using PcBuilderBackend.Application.Auth.Dto;
using PcBuilderBackend.Application.Common.Interfaces;

namespace PcBuilderBackend.Application.Auth.Queries;

public class ListApiKeysHandler(IApiKeyService apiKeys) : IRequestHandler<ListApiKeysQuery, IReadOnlyList<ApiKeyDto>>
{
    public Task<IReadOnlyList<ApiKeyDto>> Handle(ListApiKeysQuery request, CancellationToken cancellationToken) =>
        apiKeys.ListAsync(cancellationToken);
}
