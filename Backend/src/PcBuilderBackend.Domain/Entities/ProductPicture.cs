using PcBuilderBackend.Domain.Enums;

namespace PcBuilderBackend.Domain.Entities;

public class ProductPicture : BaseEntity
{
    public const int PictureKeyMaxLength = 512;

    public ProductType ProductType { get; private set; }
    public Guid ProductId { get; private set; }
    public string PictureKey { get; private set; } = null!;

    protected ProductPicture()
    {
    }

    public ProductPicture(ProductType productType, Guid productId, string pictureKey)
    {
        SetPicture(productType, productId, pictureKey);
    }

    private void SetPicture(ProductType productType, Guid productId, string pictureKey)
    {
        if (!Enum.IsDefined(productType))
            throw new ArgumentException("Product type is invalid.", nameof(productType));

        if (productId == Guid.Empty)
            throw new ArgumentException("Product id cannot be empty.", nameof(productId));

        if (string.IsNullOrWhiteSpace(pictureKey))
            throw new ArgumentException("Picture key is required.", nameof(pictureKey));

        var key = pictureKey.Trim();
        if (key.Length > PictureKeyMaxLength)
            throw new ArgumentException(
                $"Picture key must be {PictureKeyMaxLength} characters or fewer.",
                nameof(pictureKey));

        ProductType = productType;
        ProductId = productId;
        PictureKey = key;
    }
}
