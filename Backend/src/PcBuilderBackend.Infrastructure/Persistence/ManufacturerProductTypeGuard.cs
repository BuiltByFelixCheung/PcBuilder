using Microsoft.EntityFrameworkCore;
using PcBuilderBackend.Domain.Entities;
using PcBuilderBackend.Domain.Enums;

namespace PcBuilderBackend.Infrastructure.Persistence;

internal static class ManufacturerProductTypeGuard
{
    private static readonly Dictionary<Type, ProductType> ProductTypes = new()
    {
        [typeof(Chassis)] = ProductType.Chassis,
        [typeof(ChassisFan)] = ProductType.ChassisFan,
        [typeof(Chipset)] = ProductType.Chipset,
        [typeof(Cpu)] = ProductType.Cpu,
        [typeof(CpuCooler)] = ProductType.CpuCooler,
        [typeof(CpuSeries)] = ProductType.CpuSeries,
        [typeof(Gpu)] = ProductType.Gpu,
        [typeof(GpuSeries)] = ProductType.GpuSeries,
        [typeof(GraphicsCard)] = ProductType.GraphicsCard,
        [typeof(Motherboard)] = ProductType.Motherboard,
        [typeof(Psu)] = ProductType.Psu,
        [typeof(Ram)] = ProductType.Ram,
        [typeof(Socket)] = ProductType.Socket,
        [typeof(StorageDrive)] = ProductType.StorageDrive,
        [typeof(WiredNetworkAdapter)] = ProductType.WiredNetworkAdapter,
        [typeof(WirelessNetworkAdapter)] = ProductType.WirelessNetworkAdapter
    };

    public static void Ensure(DbContext context)
    {
        foreach (var entry in context.ChangeTracker.Entries<ProductEntity>())
        {
            if (entry.State != EntityState.Added
                && !(entry.State == EntityState.Modified
                     && entry.Property(nameof(ProductEntity.ManufacturerId)).IsModified))
                continue;

            if (!ProductTypes.TryGetValue(entry.Entity.GetType(), out var productType))
                throw new InvalidOperationException(
                    $"No product type is registered for {entry.Entity.GetType().Name}.");

            var manufacturerId = entry.Entity.ManufacturerId;
            var manufacturer = FindManufacturer(context, manufacturerId);
            EnsureProductLine(manufacturer, productType, manufacturerId);
        }
    }

    private static Manufacturer FindManufacturer(DbContext context, Guid manufacturerId) =>
        context.Set<Manufacturer>().Find(manufacturerId)
            ?? throw new ArgumentException(
                "Manufacturer was not found.",
                nameof(manufacturerId));

    private static void EnsureProductLine(
        Manufacturer manufacturer,
        ProductType productType,
        Guid manufacturerId)
    {
        if (!manufacturer.ProductTypes.Contains(productType))
            throw new ArgumentException(
                $"{manufacturer.Name} does not produce {productType}.",
                nameof(manufacturerId));
    }
}
