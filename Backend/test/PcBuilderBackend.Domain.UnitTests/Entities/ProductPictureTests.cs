using FluentAssertions;
using PcBuilderBackend.Domain.Entities;
using PcBuilderBackend.Domain.Enums;

namespace PcBuilderBackend.Domain.UnitTests.Entities;

public class ProductPictureTests
{
    [Fact]
    public void New_picture_keeps_the_product_and_storage_key()
    {
        var productId = Guid.NewGuid();

        var picture = new ProductPicture(ProductType.Cpu, productId, " pc-builder/cpu.jpg ");

        picture.Id.Should().NotBe(Guid.Empty);
        picture.IsActive.Should().BeTrue();
        picture.ProductType.Should().Be(ProductType.Cpu);
        picture.ProductId.Should().Be(productId);
        picture.PictureKey.Should().Be("pc-builder/cpu.jpg");
    }

    [Fact]
    public void Deactivate_hides_the_row_and_keeps_the_storage_key()
    {
        var picture = new ProductPicture(ProductType.Gpu, Guid.NewGuid(), "pc-builder/gpu.png");

        picture.Deactivate();

        picture.IsActive.Should().BeFalse();
        picture.PictureKey.Should().Be("pc-builder/gpu.png");
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    public void Picture_key_is_required(string pictureKey)
    {
        var act = () => new ProductPicture(ProductType.Ram, Guid.NewGuid(), pictureKey);

        act.Should().Throw<ArgumentException>().WithParameterName("pictureKey");
    }

    [Fact]
    public void Product_id_is_required()
    {
        var act = () => new ProductPicture(ProductType.Ram, Guid.Empty, "pc-builder/ram.jpg");

        act.Should().Throw<ArgumentException>().WithParameterName("productId");
    }

    [Fact]
    public void Product_type_must_be_defined()
    {
        var act = () => new ProductPicture((ProductType)(-1), Guid.NewGuid(), "pc-builder/ram.jpg");

        act.Should().Throw<ArgumentException>().WithParameterName("productType");
    }
}
