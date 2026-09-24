using MediatR;

namespace PcBuilderBackend.Application.Catalog.Cpus.Commands.BulkDeleteCpus;

public record BulkDeleteCpusCommand(List<Guid> Ids) : IRequest<bool>;