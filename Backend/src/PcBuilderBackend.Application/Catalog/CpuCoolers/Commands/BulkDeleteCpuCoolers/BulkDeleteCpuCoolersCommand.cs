using MediatR;

namespace PcBuilderBackend.Application.Catalog.CpuCoolers.Commands.BulkDeleteCpuCoolers;

public record BulkDeleteCpuCoolersCommand(List<Guid> Ids) : IRequest<bool>;
