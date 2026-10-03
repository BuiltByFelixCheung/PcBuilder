using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PcBuilderBackend.Domain.Entities;

namespace PcBuilderBackend.Infrastructure.Persistence.Configurations;

internal sealed class CpuCoolerConfiguration : IEntityTypeConfiguration<CpuCooler>
{
    public void Configure(EntityTypeBuilder<CpuCooler> builder)
    {
        builder.ConfigureGuidBaseEntity();

        builder.Property(c => c.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(c => c.CoolerLengthMm).HasPrecision(6, 2);
        builder.Property(c => c.CoolerWidthMm).HasPrecision(6, 2);
        builder.Property(c => c.CoolerHeightMm).HasPrecision(6, 2);
        builder.Property(c => c.MaxRamHeightMm).HasPrecision(6, 2);
        builder.Property(c => c.RadiatorLengthMm).HasPrecision(6, 2);
        builder.Property(c => c.RadiatorWidthMm).HasPrecision(6, 2);
        builder.Property(c => c.RadiatorHeightMm).HasPrecision(6, 2);
        builder.Property(c => c.WaterBlockLengthMm).HasPrecision(6, 2);
        builder.Property(c => c.WaterBlockWidthMm).HasPrecision(6, 2);
        builder.Property(c => c.WaterBlockHeightMm).HasPrecision(6, 2);
        builder.Property(c => c.FanThicknessMm).HasPrecision(6, 2);
        builder.Property(c => c.FanWidthMm).HasPrecision(6, 2);
        builder.Property(c => c.FanHeightMm).HasPrecision(6, 2);

        builder.HasOne(c => c.Manufacturer)
            .WithMany(m => m.CpuCoolers)
            .HasForeignKey(c => c.ManufacturerId)
            .OnDelete(DeleteBehavior.Restrict);
        
        builder.HasMany(c => c.CpuCoolerSockets)
            .WithOne(cs => cs.CpuCooler)
            .HasForeignKey(cs => cs.CpuCoolerId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}