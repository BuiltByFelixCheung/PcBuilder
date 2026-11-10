using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PcBuilderBackend.Domain.Entities;

namespace PcBuilderBackend.Infrastructure.Persistence.Configurations;

internal sealed class PcBuildConfiguration : IEntityTypeConfiguration<PcBuild>
{
    public void Configure(EntityTypeBuilder<PcBuild> builder)
    {
        builder.ConfigureGuidBaseEntity();

        builder.ToTable("PcBuilds");

        builder.Ignore(pcBuild => pcBuild.StorageDevices);
        builder.Ignore(pcBuild => pcBuild.ChassisFans);
        builder.Ignore(pcBuild => pcBuild.WiredNetworkAdapters);
        builder.Ignore(pcBuild => pcBuild.WirelessNetworkAdapters);

        builder.Navigation(pcBuild => pcBuild.Parts)
            .HasField("_parts")
            .UsePropertyAccessMode(PropertyAccessMode.Field);

        builder.Property(pcBuild => pcBuild.Name)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(pcBuild => pcBuild.Description)
            .HasMaxLength(500);

        builder.Property(pcBuild => pcBuild.PictureEditTokenHash)
            .HasMaxLength(64);

        builder.HasOne<Chassis>()
            .WithMany()
            .HasForeignKey(pcBuild => pcBuild.ChassisId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<Motherboard>()
            .WithMany()
            .HasForeignKey(pcBuild => pcBuild.MotherboardId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<Cpu>()
            .WithMany()
            .HasForeignKey(pcBuild => pcBuild.CpuId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<Ram>()
            .WithMany()
            .HasForeignKey(pcBuild => pcBuild.RamKitId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<Psu>()
            .WithMany()
            .HasForeignKey(pcBuild => pcBuild.PsuId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<CpuCooler>()
            .WithMany()
            .HasForeignKey(pcBuild => pcBuild.CpuCoolerId)
            .OnDelete(DeleteBehavior.Restrict)
            .IsRequired(false);

        builder.HasOne<GraphicsCard>()
            .WithMany()
            .HasForeignKey(pcBuild => pcBuild.GraphicsCardId)
            .OnDelete(DeleteBehavior.Restrict)
            .IsRequired(false);

        builder.HasOne(pcBuild => pcBuild.User)
            .WithOne(user => user.PcBuild)
            .HasForeignKey<PcBuildUser>(user => user.PcBuildId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
