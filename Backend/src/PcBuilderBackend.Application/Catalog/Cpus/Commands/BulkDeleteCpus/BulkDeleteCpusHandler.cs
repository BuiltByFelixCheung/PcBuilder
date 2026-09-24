using MediatR;
using Microsoft.Extensions.Logging;
using PcBuilderBackend.Application.Common.Interfaces;
using PcBuilderBackend.Application.Common.Logging;

namespace PcBuilderBackend.Application.Catalog.Cpus.Commands.BulkDeleteCpus;

public class BulkDeleteCpusHandler(
    ICpuRepository cpus,
    IUnitOfWork unitOfWork,
    ILogger<BulkDeleteCpusHandler> logger)
    : IRequestHandler<BulkDeleteCpusCommand, bool>
{
    public async Task<bool> Handle(BulkDeleteCpusCommand request, CancellationToken cancellationToken)
    {
        var ids = request.Ids.Distinct().ToList();

        var entities = await cpus.GetByIdsAsync(ids, cancellationToken);

        if (entities.Count != ids.Count)
        {
            EntityLog.BulkAborted(logger, "delete", EntityLog.Cpu, ids.Count, entities.Count);
            return false;
        }

        foreach (var entity in entities)
        {
            entity.Deactivate();
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);

        EntityLog.BulkDeleted(logger, entities.Count, EntityLog.Cpu);

        return true;
    }
}
