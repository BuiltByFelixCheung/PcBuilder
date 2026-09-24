using MediatR;
using Microsoft.Extensions.Logging;
using PcBuilderBackend.Application.Common.Interfaces;
using PcBuilderBackend.Application.Common.Logging;

namespace PcBuilderBackend.Application.Catalog.Motherboards.Commands.BulkDeleteMotherboards;

public class BulkDeleteMotherboardsHandler(
    IMotherboardRepository motherboards,
    IUnitOfWork unitOfWork,
    ILogger<BulkDeleteMotherboardsHandler> logger)
    : IRequestHandler<BulkDeleteMotherboardsCommand, bool>
{
    public async Task<bool> Handle(BulkDeleteMotherboardsCommand request, CancellationToken cancellationToken)
    {
        var ids = request.Ids.Distinct().ToList();
        var entities = await motherboards.GetByIdsAsync(ids, cancellationToken);

        if (entities.Count != ids.Count)
        {
            EntityLog.BulkAborted(logger, "delete", EntityLog.Motherboard, ids.Count, entities.Count);
            return false;
        }

        foreach (var entity in entities)
            entity.Deactivate();

        await unitOfWork.SaveChangesAsync(cancellationToken);
        EntityLog.BulkDeleted(logger, entities.Count, EntityLog.Motherboard);
        return true;
    }
}
