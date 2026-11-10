using Microsoft.EntityFrameworkCore;
using PcBuilderBackend.Application.Catalog.ProductPictures;
using PcBuilderBackend.Domain.Enums;

namespace PcBuilderBackend.Infrastructure.Persistence;

public sealed class ProductExistenceLookup(PcBuilderDbContext db) : IProductExistenceLookup
{
    public Task<bool> ExistsAsync(
        ProductType productType,
        Guid productId,
        CancellationToken cancellationToken)
    {
        if (productId == Guid.Empty || !Enum.IsDefined(productType))
            return Task.FromResult(false);

        return productType switch
        {
            ProductType.Chassis => db.Chassis.AnyAsync(entity => entity.Id == productId, cancellationToken),
            ProductType.ChassisFan => db.ChassisFans.AnyAsync(entity => entity.Id == productId, cancellationToken),
            ProductType.Chipset => db.Chipsets.AnyAsync(entity => entity.Id == productId, cancellationToken),
            ProductType.Cpu => db.Cpus.AnyAsync(entity => entity.Id == productId, cancellationToken),
            ProductType.CpuCooler => db.CpuCoolers.AnyAsync(entity => entity.Id == productId, cancellationToken),
            ProductType.CpuSeries => db.CpuSeries.AnyAsync(entity => entity.Id == productId, cancellationToken),
            ProductType.Gpu => db.Gpus.AnyAsync(entity => entity.Id == productId, cancellationToken),
            ProductType.GpuSeries => db.GpuSeries.AnyAsync(entity => entity.Id == productId, cancellationToken),
            ProductType.GraphicsCard => db.GraphicsCards.AnyAsync(entity => entity.Id == productId, cancellationToken),
            ProductType.Motherboard => db.Motherboards.AnyAsync(entity => entity.Id == productId, cancellationToken),
            ProductType.Psu => db.Psus.AnyAsync(entity => entity.Id == productId, cancellationToken),
            ProductType.Ram => db.Rams.AnyAsync(entity => entity.Id == productId, cancellationToken),
            ProductType.Socket => db.Sockets.AnyAsync(entity => entity.Id == productId, cancellationToken),
            ProductType.StorageDrive => db.StorageDrives.AnyAsync(entity => entity.Id == productId, cancellationToken),
            ProductType.WiredNetworkAdapter =>
                db.WiredNetworkAdapters.AnyAsync(entity => entity.Id == productId, cancellationToken),
            ProductType.WirelessNetworkAdapter =>
                db.WirelessNetworkAdapters.AnyAsync(entity => entity.Id == productId, cancellationToken),
            _ => Task.FromResult(false)
        };
    }
}
