using MediatR;
using Microsoft.Extensions.Logging;
using PcBuilderBackend.Application.Common.Caching;
using PcBuilderBackend.Application.Common.Interfaces;
using PcBuilderBackend.Application.Common.Logging;
using PcBuilderBackend.Domain.Entities;

namespace PcBuilderBackend.Application.MasterData.Sockets.Commands.BulkDeleteSockets;

public class BulkDeleteSocketsHandler(
    IRepository<Socket> sockets,
    ILogger<BulkDeleteSocketsHandler> logger,
    IUnitOfWork unitOfWork,
    ICacheService cache)
    : IRequestHandler<BulkDeleteSocketsCommand, bool>
{
    public async Task<bool> Handle(BulkDeleteSocketsCommand request, CancellationToken cancellationToken)
    {
        var entities = await sockets.GetByIdsAsync(request.Ids, cancellationToken);

        if (entities.Count != request.Ids.Count) return false;

        foreach (var socket in entities) socket.Deactivate();

        await unitOfWork.SaveChangesAsync(cancellationToken);
        EntityLog.BulkDeleted(logger, request.Ids.Count, EntityLog.Socket);
        await cache.RemoveByPrefixAsync(MasterDataCacheKeys.Sockets.Prefix, cancellationToken);
        return true;
    }
}
