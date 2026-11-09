using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PcBuilderBackend.Domain.Entities;

namespace PcBuilderBackend.Infrastructure.Persistence.Configurations;

internal sealed class BuildPictureConfiguration : IEntityTypeConfiguration<BuildPicture>
{
    public void Configure(EntityTypeBuilder<BuildPicture> builder)
    {
        builder.ConfigureGuidBaseEntity();

        builder.Property(picture => picture.BuildId).IsRequired();
        builder.Property(picture => picture.PictureKey)
            .IsRequired()
            .HasMaxLength(BuildPicture.PictureKeyMaxLength);

        builder.HasIndex(picture => picture.PictureKey).IsUnique();
        builder.HasIndex(picture => picture.BuildId);

        builder.HasOne<PcBuild>()
            .WithMany()
            .HasForeignKey(picture => picture.BuildId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
