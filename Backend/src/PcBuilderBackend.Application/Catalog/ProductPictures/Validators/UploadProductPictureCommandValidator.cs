using FluentValidation;
using PcBuilderBackend.Application.Catalog.ProductPictures.Commands.UploadProductPicture;

namespace PcBuilderBackend.Application.Catalog.ProductPictures.Validators;

public class UploadProductPictureCommandValidator : AbstractValidator<UploadProductPictureCommand>
{
    public UploadProductPictureCommandValidator(IProductExistenceLookup products)
    {
        RuleFor(command => command.ProductType).IsInEnum();
        RuleFor(command => command.ProductId).NotEmpty();
        RuleFor(command => command.FileName).NotEmpty().MaximumLength(255);
        RuleFor(command => command.Length)
            .GreaterThan(0)
            .LessThanOrEqualTo(ProductPictureLimits.MaxBytes)
            .WithMessage($"Picture must be between 1 byte and {ProductPictureLimits.MaxBytes} bytes.");
        RuleFor(command => command)
            .Must(command => ProductPictureLimits.IsAllowedImage(command.FileName, command.ContentType))
            .WithMessage("Picture must be a JPEG, PNG, WebP, or GIF file.")
            .WithName("File");

        When(
            command => Enum.IsDefined(command.ProductType) && command.ProductId != Guid.Empty,
            () =>
            {
                RuleFor(command => command)
                    .MustAsync((command, cancellationToken) =>
                        products.ExistsAsync(command.ProductType, command.ProductId, cancellationToken))
                    .WithMessage("Product was not found.")
                    .WithName("ProductId");
            });
    }
}
