using FluentValidation;
using PcBuilderBackend.Application.Catalog.ChassisFans;

namespace PcBuilderBackend.Application.Catalog.ChassisFans.Validators;

public sealed class ChassisFanFieldsValidator<T> : AbstractValidator<T>
    where T : IChassisFanFields
{
    public ChassisFanFieldsValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.ManufacturerId).NotEmpty();
        RuleFor(x => x.DiameterMm).IsInEnum();
        RuleFor(x => x.FansCountPerPack).GreaterThan(0);
        RuleFor(x => x.ThicknessMm).GreaterThan(0);
        RuleFor(x => x.HeaderType).IsInEnum();
        RuleFor(x => x.MaxFansPerDaisyChain)
            .NotNull()
            .GreaterThan(1)
            .When(x => x.SupportsDaisyChain);
        RuleFor(x => x.MaxFansPerDaisyChain)
            .Null()
            .When(x => !x.SupportsDaisyChain);
    }
}
