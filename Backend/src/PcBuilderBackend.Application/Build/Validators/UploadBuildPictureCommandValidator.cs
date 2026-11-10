using FluentValidation;
using PcBuilderBackend.Application.Build.Commands.UploadBuildPicture;
using PcBuilderBackend.Application.Catalog.ProductPictures;

namespace PcBuilderBackend.Application.Build.Validators;

public class UploadBuildPictureCommandValidator : AbstractValidator<UploadBuildPictureCommand>
{
    public UploadBuildPictureCommandValidator()
    {
        RuleFor(command => command.BuildId).NotEmpty();
        RuleFor(command => command.FileName).NotEmpty().MaximumLength(255);
        RuleFor(command => command.Length)
            .GreaterThan(0)
            .LessThanOrEqualTo(ProductPictureLimits.MaxBytes)
            .WithMessage($"Picture must be between 1 byte and {ProductPictureLimits.MaxBytes} bytes.");
        RuleFor(command => command)
            .Must(command => ProductPictureLimits.IsAllowedImage(command.FileName, command.ContentType))
            .WithMessage("Picture must be a JPEG, PNG, WebP, or GIF file.")
            .WithName("File");
    }
}
