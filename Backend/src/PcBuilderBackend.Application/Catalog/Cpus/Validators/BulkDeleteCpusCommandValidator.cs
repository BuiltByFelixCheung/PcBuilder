using FluentValidation;
using PcBuilderBackend.Application.Catalog.Cpus.Commands.BulkDeleteCpus;

namespace PcBuilderBackend.Application.Catalog.Cpus.Validators;

public class BulkDeleteCpusCommandValidator : AbstractValidator<BulkDeleteCpusCommand>
{
    public BulkDeleteCpusCommandValidator()
    {
        RuleFor(x => x.Ids).NotEmpty().WithMessage("CpuIds list cannot be empty.");
    }
}