using FluentValidation;
using PcBuilderBackend.Application.Catalog.Psus.Commands.BulkUpdatePsuCables;

namespace PcBuilderBackend.Application.Catalog.Psus.Validators;

public class BulkUpdatePsuCablesCommandValidator : AbstractValidator<BulkUpdatePsuCablesCommand>
{
    public BulkUpdatePsuCablesCommandValidator()
    {
        RuleFor(x => x.PsuId).NotEmpty();
        Include(new PsuCableRulesValidator<BulkUpdatePsuCablesCommand>());
    }
}
