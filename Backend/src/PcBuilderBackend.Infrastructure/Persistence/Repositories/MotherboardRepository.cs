using Microsoft.EntityFrameworkCore;
using PcBuilderBackend.Application.Catalog.Motherboards;
using PcBuilderBackend.Application.Common.Interfaces;
using PcBuilderBackend.Domain.Entities;

namespace PcBuilderBackend.Infrastructure.Persistence.Repositories;

public class MotherboardRepository(PcBuilderDbContext db) : IMotherboardRepository
{
    public Task<Motherboard?> GetByIdAsync(Guid id, CancellationToken cancellationToken) =>
        db.Motherboards.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    
    public Task<Motherboard?> GetWithChildrenAsync(Guid id, CancellationToken cancellationToken) =>
        db.Motherboards
            .Include(x => x.PcieSlots)
            .Include(x => x.M2Slots)
                .ThenInclude(x => x.FormFactors)
            .Include(x => x.UsbPorts)
            .AsSplitQuery()
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    
    public async Task<IReadOnlyList<Motherboard>> GetByIdsAsync(
        IReadOnlyCollection<Guid> ids,
        CancellationToken cancellationToken) =>
        await db.Motherboards.Where(x => ids.Contains(x.Id)).ToListAsync(cancellationToken);
    
    public void Add(Motherboard motherboard) => db.Motherboards.Add(motherboard);

    public void DeletePcieSlot(MotherboardPcie pcieSlot) => db.MotherboardPcieSlots.Remove(pcieSlot);
    public void DeleteM2Slot(MotherboardM2 m2Slot) => db.MotherboardM2Slots.Remove(m2Slot);
    public void DeleteUsbPort(MotherboardUsb usbPort) => db.MotherboardUsbPorts.Remove(usbPort);
    public void DeleteM2FormFactor(MotherboardM2FormFactor m2FormFactor) => db.MotherboardM2FormFactors.Remove(m2FormFactor);
}