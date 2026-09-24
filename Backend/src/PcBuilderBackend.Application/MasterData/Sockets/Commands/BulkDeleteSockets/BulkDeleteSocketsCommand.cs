using MediatR;

namespace PcBuilderBackend.Application.MasterData.Sockets.Commands.BulkDeleteSockets;

public record BulkDeleteSocketsCommand(List<Guid> Ids): IRequest<bool>;