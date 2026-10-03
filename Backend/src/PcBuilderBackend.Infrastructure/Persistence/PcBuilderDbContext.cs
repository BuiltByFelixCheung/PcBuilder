using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using PcBuilderBackend.Domain.Entities;

namespace PcBuilderBackend.Infrastructure.Persistence;

public class PcBuilderDbContext(DbContextOptions<PcBuilderDbContext> options)
    : DbContext(options)
{
    public DbSet<Cpu> Cpus { get; set; } = null!;
    public DbSet<Manufacturer> Manufacturers { get; set; } = null!;
    public DbSet<Socket> Sockets { get; set; } = null!;
    public DbSet<Chipset> Chipsets { get; set; } = null!;
    public DbSet<Motherboard> Motherboards { get; set; } = null!;
    public DbSet<MotherboardPcie> MotherboardPcieSlots { get; set; } = null!;
    public DbSet<MotherboardM2> MotherboardM2Slots { get; set; } = null!;
    public DbSet<MotherboardM2FormFactor> MotherboardM2FormFactors { get; set; } = null!;
    public DbSet<MotherboardUsb> MotherboardUsbPorts { get; set; } = null!;
    public DbSet<Gpu> Gpus { get; set; } = null!;
    public DbSet<GpuSeries> GpuSeries { get; set; } = null!;
    public DbSet<CpuSeries> CpuSeries { get; set; } = null!;
    public DbSet<GraphicsCard> GraphicsCards { get; set; } = null!;
    public DbSet<Ram> Rams { get; set; } = null!;
    public DbSet<Psu> Psus { get; set; } = null!;
    public DbSet<PsuCable> PsuCables { get; set; } = null!;
    public DbSet<StorageDrive> StorageDrives { get; set; } = null!;
    public DbSet<WiredNetworkAdapter> WiredNetworkAdapters { get; set; } = null!;
    public DbSet<WirelessNetworkAdapter> WirelessNetworkAdapters { get; set; } = null!;
    public DbSet<Chassis> Chassis { get; set; } = null!;
    public DbSet<ChassisFan> ChassisFans { get; set; } = null!;
    public DbSet<ChassisFanMount> ChassisFanMounts { get; set; } = null!;
    public DbSet<ChassisFanMountOption> ChassisFanMountOptions { get; set; } = null!;
    public DbSet<ChassisDriveBay> ChassisDriveBays { get; set; } = null!;
    public DbSet<ChassisPcieSlot> ChassisPcieSlots { get; set; } = null!;
    public DbSet<ChassisMbFormFactor> ChassisMbFormFactors { get; set; } = null!;
    public DbSet<ChassisRadiator> ChassisRadiators { get; set; } = null!;
    public DbSet<ChassisPsuFormFactor> ChassisPsuFormFactors { get; set; } = null!;
    public DbSet<CpuCooler> CpuCoolers { get; set; } = null!;
    public DbSet<CpuCoolerSocket> CpuCoolerSockets { get; set; } = null!;
    public DbSet<CpuRamCompat> CpuRamCompats { get; set; } = null!;
    public DbSet<CpuSupportChipset> CpuSupportChipsets { get; set; } = null!;
    public DbSet<PcBuild> PcBuilds { get; set; } = null!;
    public DbSet<PcBuildUser> PcBuildUsers { get; set; } = null!;
    public DbSet<PcBuildPart> PcBuildParts { get; set; } = null!;

    public override int SaveChanges()
    {
        PrepareSave();
        return base.SaveChanges();
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        PrepareSave();
        return base.SaveChangesAsync(cancellationToken);
    }

    private void PrepareSave()
    {
        var utcNow = DateTime.UtcNow;
        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.CreatedAtUtc = utcNow;
                    break;
                case EntityState.Modified:
                    entry.Entity.UpdatedAtUtc = utcNow;
                    entry.Entity.ConcurrencyToken = Guid.NewGuid();
                    break;
                case EntityState.Detached:
                case EntityState.Unchanged:
                case EntityState.Deleted:
                    break;
                default:
                    throw new InvalidOperationException($"Unexpected entity state: {entry.State}");
            }
        }

        ManufacturerProductTypeGuard.Ensure(this);
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ConfigurePostgresEnums();

        foreach (var clrType in modelBuilder.Model.GetEntityTypes()
                     .Select(entityType => entityType.ClrType)
                     .Where(clrType => typeof(BaseEntity).IsAssignableFrom(clrType)))
        {
            var parameter = Expression.Parameter(clrType, "e");
            var body = Expression.Equal(
                Expression.Property(parameter, nameof(BaseEntity.IsActive)),
                Expression.Constant(true));
            modelBuilder.Entity(clrType).HasQueryFilter(Expression.Lambda(body, parameter));
        }

        modelBuilder.ApplyConfigurationsFromAssembly(typeof(PcBuilderDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }
}