using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PcBuilderBackend.Domain.Entities;

namespace PcBuilderBackend.Infrastructure.Persistence.Configurations;

internal sealed class ProductPictureConfiguration : IEntityTypeConfiguration<ProductPicture>
{
    public void Configure(EntityTypeBuilder<ProductPicture> builder)
    {
        builder.ConfigureGuidBaseEntity();

        builder.Property(picture => picture.ProductType).IsRequired();
        builder.Property(picture => picture.ProductId).IsRequired();
        builder.Property(picture => picture.PictureKey)
            .IsRequired()
            .HasMaxLength(ProductPicture.PictureKeyMaxLength);

        builder.HasIndex(picture => picture.PictureKey).IsUnique();
        builder.HasIndex(picture => new { picture.ProductType, picture.ProductId });
    }
}
