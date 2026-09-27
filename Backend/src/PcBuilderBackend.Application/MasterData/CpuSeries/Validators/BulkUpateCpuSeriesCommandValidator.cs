using FluentValidation;
using PcBuilderBackend.Application.MasterData.CpuSeries.Commands.BulkUpdateCpuSeries;

namespace PcBuilderBackend.Application.MasterData.CpuSeries.Validators;

public class BulkUpdateCpuSeriesCommandValidator : AbstractValidator<BulkUpdateCpuSeriesCommand>
{
    public BulkUpdateCpuSeriesCommandValidator()
    {
        RuleFor(x => x.CpuSeries)
            .NotEmpty().WithMessage("CpuSeries cannot be empty.");

        RuleForEach(x => x.CpuSeries).ChildRules(series =>
        {
            series.RuleFor(x => x.Id).NotEmpty().WithMessage("Id cannot be empty.");
            series.RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Name cannot be empty.")
                .MaximumLength(200).WithMessage("Name cannot be more than 200 characters.");
            series.RuleFor(x => x.ManufacturerId).NotEmpty().WithMessage("ManufacturerId cannot be empty.");
            series.RuleFor(x => x.SocketId).NotEmpty().WithMessage("SocketId cannot be empty.");
        });
    }
}