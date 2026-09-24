using MediatR;
using PcBuilderBackend.Application.Common.Interfaces;

namespace PcBuilderBackend.Application.Catalog.Memories.Commands.BulkDeleteMemories;

public class BulkDeleteMemoriesHandler(IRamRepository memories, IUnitOfWork unitOfWork) : IRequestHandler<BulkDeleteMemoriesCommand, bool>
{
    public async Task<bool> Handle(BulkDeleteMemoriesCommand request, CancellationToken cancellationToken)
    {
        var ids = request.Ids.Distinct().ToList();
        var entities = await memories.GetByIdsAsync(ids, cancellationToken);

        if (entities.Count != ids.Count)
            return false;

        foreach (var entity in entities)
        {
            entity.Deactivate();
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
    }
}