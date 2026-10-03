using Microsoft.EntityFrameworkCore;
using PcBuilderBackend.Application.Catalog.Cpus;
using PcBuilderBackend.Application.Common.Interfaces;
using PcBuilderBackend.Domain.Entities;

namespace PcBuilderBackend.Infrastructure.Persistence.Repositories;

public sealed class CpuRepository(PcBuilderDbContext db) : ICpuRepository
{
    public Task<Cpu?> GetByIdAsync(Guid id, CancellationToken cancellationToken) =>
        db.Cpus.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

    public Task<Cpu?> GetWithChildrenAsync(Guid id, CancellationToken cancellationToken) =>
        db.Cpus
            .Include(x => x.RamCompats)
            .Include(x => x.SupportedChipsets)
                .ThenInclude(x => x.Chipset)
            .AsSplitQuery()
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

    public async Task<IReadOnlyList<Cpu>> GetByIdsAsync(
        IReadOnlyCollection<Guid> ids,
        CancellationToken cancellationToken) =>
        await db.Cpus.Where(x => ids.Contains(x.Id)).ToListAsync(cancellationToken);

    public void Add(Cpu cpu) => db.Cpus.Add(cpu);

    public void DeleteRamCompat(CpuRamCompat ramCompat) => db.CpuRamCompats.Remove(ramCompat);

    public void DeleteSupportedChipset(CpuSupportChipset supportChipset) =>
        db.CpuSupportChipsets.Remove(supportChipset);
}
