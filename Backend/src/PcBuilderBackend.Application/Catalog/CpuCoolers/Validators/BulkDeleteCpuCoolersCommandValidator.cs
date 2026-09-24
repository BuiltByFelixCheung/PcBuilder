using FluentValidation;
using PcBuilderBackend.Application.Catalog.CpuCoolers.Commands.BulkDeleteCpuCoolers;

namespace PcBuilderBackend.Application.Catalog.CpuCoolers.Validators;

public class BulkDeleteCpuCoolersCommandValidator : AbstractValidator<BulkDeleteCpuCoolersCommand>
{
    public BulkDeleteCpuCoolersCommandValidator()
    {
        RuleFor(x => x.Ids)
            .NotEmpty().WithMessage("CpuCoolerIds list cannot be empty.");
    }
}
