using FluentValidation;
using PcBuilderBackend.Application.MasterData.Manufacturers.Commands.BulkUpdateManufacturers;

namespace PcBuilderBackend.Application.MasterData.Manufacturers.Validators;

public class BulkUpdateManufacturersCommandValidator: AbstractValidator<BulkUpdateManufacturersCommand>
{
    public BulkUpdateManufacturersCommandValidator()
    {
        RuleForEach(manufacturer => manufacturer.Manufacturers).ChildRules(manufacturer =>
        {
            manufacturer.RuleFor(x => x.Id).NotEmpty().WithMessage("Id is required");
            manufacturer.RuleFor(x => x.Name).NotEmpty().WithMessage("Name is required").MaximumLength(200);
            manufacturer.RuleForEach(x => x.ProductTypes).IsInEnum();
        });
    }
}