using Microsoft.EntityFrameworkCore;
using PcBuilderBackend.Application.Catalog.Chassis;
using PcBuilderBackend.Domain.Entities;

namespace PcBuilderBackend.Infrastructure.Persistence.Repositories;

public class ChassisRepository(PcBuilderDbContext db) : IChassisRepository
{
    public Task<Chassis?> GetByIdAsync(Guid id, CancellationToken cancellationToken) =>
        db.Chassis.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

    public Task<Chassis?> GetWithChildrenAsync(Guid id, CancellationToken cancellationToken) =>
        db.Chassis
            .Include(x => x.DriveBays)
            .Include(x => x.FanMounts)
            .ThenInclude(x => x.Options)
            .Include(x => x.MbFormFactors)
            .Include(x => x.PcieSlots)
            .Include(x => x.PsuFormFactors)
            .Include(x => x.Radiators)
            .AsSplitQuery()
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

    public async Task<IReadOnlyList<Chassis>> GetByIdsAsync(
        IReadOnlyCollection<Guid> ids,
        CancellationToken cancellationToken) =>
        await db.Chassis.Where(x => ids.Contains(x.Id)).ToListAsync(cancellationToken);

    public void Add(Chassis chassis) => db.Chassis.Add(chassis);

    public void DeleteDriveBay(ChassisDriveBay driveBay) => db.ChassisDriveBays.Remove(driveBay);

    public void DeleteFanMount(ChassisFanMount fanMount) => db.ChassisFanMounts.Remove(fanMount);

    public void DeleteFanMountOption(ChassisFanMountOption fanMountOption) =>
        db.ChassisFanMountOptions.Remove(fanMountOption);

    public void DeleteMbFormFactor(ChassisMbFormFactor mbFormFactor) =>
        db.ChassisMbFormFactors.Remove(mbFormFactor);

    public void DeletePcieSlot(ChassisPcieSlot pcieSlot) => db.ChassisPcieSlots.Remove(pcieSlot);

    public void DeleteRadiator(ChassisRadiator radiator) => db.ChassisRadiators.Remove(radiator);

    public void DeletePsuFormFactor(ChassisPsuFormFactor psuFormFactor) =>
        db.ChassisPsuFormFactors.Remove(psuFormFactor);
}