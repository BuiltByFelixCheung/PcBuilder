using FluentValidation;
using PcBuilderBackend.Application.Auth.Commands.Register;

namespace PcBuilderBackend.Application.Auth.Validators;

public class RegisterCommandValidator : AbstractValidator<RegisterCommand>
{
    public RegisterCommandValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty()
            .EmailAddress()
            .MaximumLength(256);

        RuleFor(x => x.Password)
            .NotEmpty()
            .MinimumLength(10);

        RuleFor(x => x.UserName)
            .NotEmpty()
            .MaximumLength(100)
            .Must(name => !name.Contains('@'))
            .WithMessage("Username cannot be an email address.")
            .Must((command, userName) =>
                !string.Equals(userName.Trim(), command.Email.Trim(), StringComparison.OrdinalIgnoreCase))
            .WithMessage("Username must be different from email.");
    }
}
