using FluentValidation;
using PcBuilderBackend.Application.Auth.Commands.CreateApiKey;

namespace PcBuilderBackend.Application.Auth.Validators;

public class CreateApiKeyCommandValidator : AbstractValidator<CreateApiKeyCommand>
{
    public CreateApiKeyCommandValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty()
            .MaximumLength(100);

        RuleFor(x => x.ExpiresAtUtc)
            .Must(expires => expires is null || expires.Value > DateTime.UtcNow)
            .WithMessage("Expiry must be in the future.");
    }
}
