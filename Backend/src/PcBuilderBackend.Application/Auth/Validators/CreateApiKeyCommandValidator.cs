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
            .Must(BeInTheFuture)
            .WithMessage("Expiry must be in the future.");
    }

    private static bool BeInTheFuture(DateTime? expires) =>
        expires is null || NormalizeUtc(expires.Value) > DateTime.UtcNow;

    private static DateTime NormalizeUtc(DateTime value) => value.Kind switch
    {
        DateTimeKind.Utc => value,
        DateTimeKind.Local => value.ToUniversalTime(),
        _ => DateTime.SpecifyKind(value, DateTimeKind.Utc)
    };
}
