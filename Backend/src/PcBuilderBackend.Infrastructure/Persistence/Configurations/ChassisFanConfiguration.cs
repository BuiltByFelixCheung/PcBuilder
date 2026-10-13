using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PcBuilderBackend.Domain.Entities;

namespace PcBuilderBackend.Infrastructure.Persistence.Configurations;

internal sealed class ChassisFanConfiguration : IEntityTypeConfiguration<ChassisFan>
{
    public void Configure(EntityTypeBuilder<ChassisFan> builder)
    {
        builder.ConfigureGuidBaseEntity();

        builder.Property(f => f.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(f => f.FansCountPerPack)
            .IsRequired();

        builder.Property(f => f.ThicknessMm)
            .HasPrecision(6, 2);

        builder.Property(f => f.SupportsDaisyChain)
            .IsRequired();

        builder.HasOne(f => f.Manufacturer)
            .WithMany(m => m.ChassisFans)
            .HasForeignKey(f => f.ManufacturerId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}