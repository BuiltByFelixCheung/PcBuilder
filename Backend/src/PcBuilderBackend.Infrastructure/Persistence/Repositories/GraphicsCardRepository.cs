using Microsoft.EntityFrameworkCore;
using PcBuilderBackend.Application.Catalog.GraphicsCards;
using PcBuilderBackend.Application.Common.Interfaces;
using PcBuilderBackend.Domain.Entities;

namespace PcBuilderBackend.Infrastructure.Persistence.Repositories;

public class GraphicsCardRepository(PcBuilderDbContext db) : IGraphicsCardRepository
{
    public async Task<GraphicsCard?> GetByIdAsync(Guid id, CancellationToken cancellationToken) =>
        await db.GraphicsCards.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    
    public async Task<GraphicsCard?> GetWithChildrenAsync(Guid id, CancellationToken cancellationToken) =>
        await db.GraphicsCards
            .Include(x => x.Gpu.Series)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    
    public async Task<IReadOnlyList<GraphicsCard>> GetByIdsAsync(
        IReadOnlyCollection<Guid> ids,
        CancellationToken cancellationToken) =>
        await db.GraphicsCards.Where(x => ids.Contains(x.Id)).ToListAsync(cancellationToken);
    
    public void Add(GraphicsCard graphicsCard) => db.GraphicsCards.Add(graphicsCard);
}