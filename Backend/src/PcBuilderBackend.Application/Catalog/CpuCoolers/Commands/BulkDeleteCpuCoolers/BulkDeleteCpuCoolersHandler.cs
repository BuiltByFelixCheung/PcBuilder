using MediatR;
using Microsoft.Extensions.Logging;
using PcBuilderBackend.Application.Common.Interfaces;
using PcBuilderBackend.Application.Common.Logging;

namespace PcBuilderBackend.Application.Catalog.CpuCoolers.Commands.BulkDeleteCpuCoolers;

public class BulkDeleteCpuCoolersHandler(
    ICpuCoolerRepository cpuCoolers,
    IUnitOfWork unitOfWork,
    ILogger<BulkDeleteCpuCoolersHandler> logger)
    : IRequestHandler<BulkDeleteCpuCoolersCommand, bool>
{
    public async Task<bool> Handle(BulkDeleteCpuCoolersCommand request, CancellationToken cancellationToken)
    {
        var ids = request.Ids.Distinct().ToList();

        var entities = await cpuCoolers.GetByIdsAsync(ids, cancellationToken);

        if (entities.Count != ids.Count)
        {
            EntityLog.BulkAborted(logger, "delete", EntityLog.CpuCooler, ids.Count, entities.Count);
            return false;
        }

        foreach (var entity in entities)
        {
            entity.Deactivate();
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);

        EntityLog.BulkDeleted(logger, entities.Count, EntityLog.CpuCooler);

        return true;
    }
}
