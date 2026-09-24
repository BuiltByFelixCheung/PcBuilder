using MediatR;

namespace PcBuilderBackend.Application.Catalog.Motherboards.Commands.BulkDeleteMotherboards;

public record BulkDeleteMotherboardsCommand(List<Guid> Ids) : IRequest<bool>;