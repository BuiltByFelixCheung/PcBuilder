using FluentValidation;
using PcBuilderBackend.Application.Build.Commands.DeleteBuildPicture;

namespace PcBuilderBackend.Application.Build.Validators;

public class DeleteBuildPictureCommandValidator : AbstractValidator<DeleteBuildPictureCommand>
{
    public DeleteBuildPictureCommandValidator()
    {
        RuleFor(command => command.Id).NotEmpty();
    }
}
