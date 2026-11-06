using FluentValidation;
using PcBuilderBackend.Application.Catalog.ProductPictures.Commands.DeleteProductPicture;

namespace PcBuilderBackend.Application.Catalog.ProductPictures.Validators;

public class DeleteProductPictureCommandValidator : AbstractValidator<DeleteProductPictureCommand>
{
    public DeleteProductPictureCommandValidator()
    {
        RuleFor(command => command.Id).NotEmpty();
    }
}
