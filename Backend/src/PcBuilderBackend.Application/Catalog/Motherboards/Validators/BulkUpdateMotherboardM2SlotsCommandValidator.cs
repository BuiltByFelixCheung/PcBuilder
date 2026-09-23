using FluentValidation;
using PcBuilderBackend.Application.Catalog.Motherboards.Commands.BulkUpdateMotherboardM2Slots;

namespace PcBuilderBackend.Application.Catalog.Motherboards.Validators;

public class BulkUpdateMotherboardM2SlotsCommandValidator
    : AbstractValidator<BulkUpdateMotherboardM2SlotsCommand>
{
    public BulkUpdateMotherboardM2SlotsCommandValidator()
    {
        RuleFor(x => x.MotherboardId).NotEmpty();
        Include(new MotherboardM2SlotRulesValidator<BulkUpdateMotherboardM2SlotsCommand>());
    }
}
