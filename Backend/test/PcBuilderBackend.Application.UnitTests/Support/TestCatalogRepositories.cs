using Microsoft.EntityFrameworkCore;
using PcBuilderBackend.Application.Catalog.ChassisFans;
using PcBuilderBackend.Application.Catalog.StorageDrives;
using PcBuilderBackend.Application.Catalog.WiredNetworkAdapters;
using PcBuilderBackend.Application.Catalog.WirelessNetworkAdapters;
using PcBuilderBackend.Domain.Entities;

namespace PcBuilderBackend.Application.UnitTests.Support;

public sealed class TestChassisFanRepository(TestApplicationDbContext db) : IChassisFanRepository
{
    public Task<ChassisFan?> GetByIdAsync(Guid id, CancellationToken cancellationToken) =>
        db.ChassisFans.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

    public async Task<IReadOnlyList<ChassisFan>> GetByIdsAsync(
        IReadOnlyCollection<Guid> ids,
        CancellationToken cancellationToken) =>
        await db.ChassisFans.Where(x => ids.Contains(x.Id)).ToListAsync(cancellationToken);

    public void Add(ChassisFan chassisFan) => db.ChassisFans.Add(chassisFan);
}

public sealed class TestStorageDriveRepository(TestApplicationDbContext db) : IStorageDriveRepository
{
    public Task<StorageDrive?> GetByIdAsync(Guid id, CancellationToken cancellationToken) =>
        db.StorageDrives.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

    public async Task<IReadOnlyList<StorageDrive>> GetByIdsAsync(
        IReadOnlyCollection<Guid> ids,
        CancellationToken cancellationToken) =>
        await db.StorageDrives.Where(x => ids.Contains(x.Id)).ToListAsync(cancellationToken);

    public void Add(StorageDrive storageDrive) => db.StorageDrives.Add(storageDrive);
}

public sealed class TestWiredNetworkAdapterRepository(TestApplicationDbContext db) : IWiredNetworkAdapterRepository
{
    public Task<WiredNetworkAdapter?> GetByIdAsync(Guid id, CancellationToken cancellationToken) =>
        db.WiredNetworkAdapters.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

    public async Task<IReadOnlyList<WiredNetworkAdapter>> GetByIdsAsync(
        IReadOnlyCollection<Guid> ids,
        CancellationToken cancellationToken) =>
        await db.WiredNetworkAdapters.Where(x => ids.Contains(x.Id)).ToListAsync(cancellationToken);

    public void Add(WiredNetworkAdapter adapter) => db.WiredNetworkAdapters.Add(adapter);
}

public sealed class TestWirelessNetworkAdapterRepository(TestApplicationDbContext db)
    : IWirelessNetworkAdapterRepository
{
    public Task<WirelessNetworkAdapter?> GetByIdAsync(Guid id, CancellationToken cancellationToken) =>
        db.WirelessNetworkAdapters.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

    public async Task<IReadOnlyList<WirelessNetworkAdapter>> GetByIdsAsync(
        IReadOnlyCollection<Guid> ids,
        CancellationToken cancellationToken) =>
        await db.WirelessNetworkAdapters.Where(x => ids.Contains(x.Id)).ToListAsync(cancellationToken);

    public void Add(WirelessNetworkAdapter adapter) => db.WirelessNetworkAdapters.Add(adapter);
}

public sealed class TestMotherboardRepository(TestApplicationDbContext db)
    : PcBuilderBackend.Application.Catalog.Motherboards.IMotherboardRepository
{
    public Task<Motherboard?> GetByIdAsync(Guid id, CancellationToken cancellationToken) =>
        db.Motherboards.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

    public Task<Motherboard?> GetWithChildrenAsync(Guid id, CancellationToken cancellationToken) =>
        db.Motherboards
            .Include(x => x.PcieSlots)
            .Include(x => x.M2Slots)
            .ThenInclude(x => x.FormFactors)
            .Include(x => x.UsbPorts)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

    public async Task<IReadOnlyList<Motherboard>> GetByIdsAsync(
        IReadOnlyCollection<Guid> ids,
        CancellationToken cancellationToken) =>
        await db.Motherboards.Where(x => ids.Contains(x.Id)).ToListAsync(cancellationToken);

    public void Add(Motherboard motherboard) => db.Motherboards.Add(motherboard);

    public void DeletePcieSlot(MotherboardPcie pcieSlot) => db.MotherboardPcieSlots.Remove(pcieSlot);

    public void DeleteM2Slot(MotherboardM2 m2Slot) => db.MotherboardM2Slots.Remove(m2Slot);

    public void DeleteUsbPort(MotherboardUsb usbPort) => db.MotherboardUsbPorts.Remove(usbPort);

    public void DeleteM2FormFactor(MotherboardM2FormFactor m2FormFactor) =>
        db.MotherboardM2FormFactors.Remove(m2FormFactor);
}

public sealed class TestChassisRepository(TestApplicationDbContext db)
    : PcBuilderBackend.Application.Catalog.Chassis.IChassisRepository
{
    public Task<Chassis?> GetByIdAsync(Guid id, CancellationToken cancellationToken) =>
        db.Chassis.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

    public Task<Chassis?> GetWithChildrenAsync(Guid id, CancellationToken cancellationToken) =>
        db.Chassis
            .Include(x => x.DriveBays)
            .Include(x => x.FanMounts)
            .ThenInclude(x => x.Options)
            .Include(x => x.PcieSlots)
            .Include(x => x.Radiators)
            .Include(x => x.MbFormFactors)
            .Include(x => x.PsuFormFactors)
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
