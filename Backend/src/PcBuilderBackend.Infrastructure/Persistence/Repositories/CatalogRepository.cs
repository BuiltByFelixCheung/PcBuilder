using Microsoft.EntityFrameworkCore;
using PcBuilderBackend.Application.Common.Interfaces;
using PcBuilderBackend.Domain.Entities;

namespace PcBuilderBackend.Infrastructure.Persistence.Repositories;

public class CatalogRepository(PcBuilderDbContext context) : ICatalogRepository
{
    public Task<Chassis?> GetChassisByIdAsync(Guid id) =>
        context.Chassis
            .Include(c => c.DriveBays)
            .Include(c => c.FanMounts)
            .ThenInclude(fm => fm.Options)
            .Include(c => c.PcieSlots)
            .Include(c => c.PsuFormFactors)
            .Include(c => c.MbFormFactors)
            .Include(c => c.Radiators)
            .AsSplitQuery()
            .FirstOrDefaultAsync(c => c.Id == id);

    public Task<ChassisFan?> GetChassisFanByIdAsync(Guid id) =>
        context.ChassisFans.FirstOrDefaultAsync(c => c.Id == id);

    public Task<List<ChassisFan>> GetChassisFansByIdsAsync(IReadOnlyCollection<Guid> ids) =>
        LoadByIds(context.ChassisFans, ids);

    public Task<Cpu?> GetCpuByIdAsync(Guid id) =>
        context.Cpus
            .Include(c => c.Socket)
            .Include(c => c.RamCompats)
            .Include(c => c.SupportedChipsets)
            .AsSplitQuery()
            .FirstOrDefaultAsync(c => c.Id == id);

    public Task<CpuCooler?> GetCpuCoolerByIdAsync(Guid id) =>
        context.CpuCoolers
            .Include(c => c.CpuCoolerSockets)
            .FirstOrDefaultAsync(c => c.Id == id);

    public Task<GraphicsCard?> GetGraphicsCardByIdAsync(Guid id) =>
        context.GraphicsCards.FirstOrDefaultAsync(g => g.Id == id);

    public Task<Motherboard?> GetMotherboardByIdAsync(Guid id) =>
        context.Motherboards
            .Include(m => m.Socket)
            .Include(m => m.PcieSlots)
            .Include(m => m.M2Slots)
            .ThenInclude(s => s.FormFactors)
            .Include(m => m.UsbPorts)
            .AsSplitQuery()
            .FirstOrDefaultAsync(m => m.Id == id);

    public Task<Ram?> GetRamByIdAsync(Guid id) =>
        context.Rams.FirstOrDefaultAsync(r => r.Id == id);

    public Task<StorageDrive?> GetStorageDeviceByIdAsync(Guid id) =>
        context.StorageDrives.FirstOrDefaultAsync(s => s.Id == id);

    public Task<List<StorageDrive>> GetStorageDevicesByIdsAsync(IReadOnlyCollection<Guid> ids) =>
        LoadByIds(context.StorageDrives, ids);

    public Task<Psu?> GetPowerSupplyByIdAsync(Guid id) =>
        context.Psus
            .Include(p => p.Cables)
            .FirstOrDefaultAsync(p => p.Id == id);

    public Task<WiredNetworkAdapter?> GetWiredNetworkAdapterByIdAsync(Guid id) =>
        context.WiredNetworkAdapters.FirstOrDefaultAsync(w => w.Id == id);

    public Task<List<WiredNetworkAdapter>> GetWiredNetworkAdaptersByIdsAsync(IReadOnlyCollection<Guid> ids) =>
        LoadByIds(context.WiredNetworkAdapters, ids);

    public Task<WirelessNetworkAdapter?> GetWirelessNetworkAdapterByIdAsync(Guid id) =>
        context.WirelessNetworkAdapters.FirstOrDefaultAsync(w => w.Id == id);

    public Task<List<WirelessNetworkAdapter>> GetWirelessNetworkAdaptersByIdsAsync(
        IReadOnlyCollection<Guid> ids) =>
        LoadByIds(context.WirelessNetworkAdapters, ids);

    private static async Task<List<T>> LoadByIds<T>(IQueryable<T> source, IReadOnlyCollection<Guid> ids)
        where T : BaseEntity
    {
        if (ids.Count == 0)
            return [];

        return await source.Where(entity => ids.Contains(entity.Id)).ToListAsync();
    }
}
