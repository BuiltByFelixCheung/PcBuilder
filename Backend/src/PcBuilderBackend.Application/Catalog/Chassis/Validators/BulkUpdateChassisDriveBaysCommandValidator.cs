using FluentValidation;
using PcBuilderBackend.Application.Catalog.Chassis.Commands.BulkUpdateChassisDriveBays;
using PcBuilderBackend.Application.Catalog.Chassis.Dto;

namespace PcBuilderBackend.Application.Catalog.Chassis.Validators;

public class BulkUpdateChassisDriveBaysCommandValidator
    : AbstractValidator<BulkUpdateChassisDriveBaysCommand>
{
    public BulkUpdateChassisDriveBaysCommandValidator()
    {
        RuleFor(x => x.ChassisId).NotEmpty();

        RuleFor(x => x.DriveBays)
            .Must(BeUniqueByFormFactor)
            .WithMessage("Duplicate drive bay size sets are not allowed.")
            .When(x => x.DriveBays.Count > 0);

        RuleForEach(x => x.DriveBays).ChildRules(bay =>
        {
            bay.RuleFor(b => b.FormFactors).NotEmpty();
            bay.RuleForEach(b => b.FormFactors).IsInEnum();
            bay.RuleFor(b => b.FormFactors)
                .Must(factors => factors.Distinct().Count() == factors.Length)
                .WithMessage("A drive bay cannot list the same size twice.");
            bay.RuleFor(b => b.SlotCount).GreaterThan(0);
        });
    }

    private static bool BeUniqueByFormFactor(List<ChassisDriveBayDto> bays) =>
        bays.Select(bay => string.Join(',', bay.FormFactors.Order())).Distinct().Count() == bays.Count;
}
