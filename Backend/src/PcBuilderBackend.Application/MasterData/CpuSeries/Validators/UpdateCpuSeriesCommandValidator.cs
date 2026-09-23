using FluentValidation;
using PcBuilderBackend.Application.MasterData.CpuSeries.Commands.UpdateCpuSeries;

namespace PcBuilderBackend.Application.MasterData.CpuSeries.Validators;

public class UpdateCpuSeriesCommandValidator : AbstractValidator<UpdateCpuSeriesCommand>
{
    public UpdateCpuSeriesCommandValidator()
    {
        RuleFor(x => x.CpuSeriesId).NotEmpty().WithMessage("CpuSeriesId cannot be empty.");
        Include(new CpuSeriesFieldsValidator<UpdateCpuSeriesCommand>());
        RuleFor(x => x.Name)
            .MaximumLength(200).WithMessage("Name cannot be more than 200 characters.");
    }
}
