using FluentValidation;
using PcBuilderBackend.Application.Catalog.CpuCoolers.Commands.BulkUpdateCpuCoolers;
using PcBuilderBackend.Domain.Enums;

namespace PcBuilderBackend.Application.Catalog.CpuCoolers.Validators;

public class BulkUpdateCpuCoolersCommandValidator : AbstractValidator<BulkUpdateCpuCoolersCommand>
{
    public BulkUpdateCpuCoolersCommandValidator()
    {
        RuleFor(x => x.CpuCoolers)
            .NotEmpty().WithMessage("At least one CPU cooler is required");

        RuleForEach(x => x.CpuCoolers).ChildRules(cooler =>
        {
            cooler.RuleFor(x => x.Id)
                .NotEmpty().WithMessage("Id is required");

            cooler.RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Name is required")
                .MaximumLength(200);

            cooler.RuleFor(x => x.ManufacturerId)
                .NotEmpty().WithMessage("ManufacturerId is required");

            cooler.RuleFor(x => x.Type)
                .IsInEnum().WithMessage("Type is invalid");

            cooler.When(x => x.Type == CpuCoolerType.Air, () =>
            {
                cooler.RuleFor(x => x.CoolerLengthMm)
                    .GreaterThan(0).When(x => x.CoolerLengthMm is not null)
                    .WithMessage("CoolerLengthMm must be greater than 0");

                cooler.RuleFor(x => x.CoolerWidthMm)
                    .GreaterThan(0).When(x => x.CoolerWidthMm is not null)
                    .WithMessage("CoolerWidthMm must be greater than 0");

                cooler.RuleFor(x => x.CoolerHeightMm)
                    .NotNull().WithMessage("CoolerHeightMm is required for air coolers")
                    .GreaterThan(0).WithMessage("CoolerHeightMm must be greater than 0");

                cooler.RuleFor(x => x.MaxRamHeightMm)
                    .NotNull().WithMessage("MaxRamHeightMm is required for air coolers")
                    .GreaterThan(0).WithMessage("MaxRamHeightMm must be greater than 0");

                cooler.RuleFor(x => x.RadiatorClass)
                    .Null().WithMessage("RadiatorClass must be empty for air coolers");

                cooler.RuleFor(x => x.RadiatorLengthMm)
                    .Null().WithMessage("RadiatorLengthMm must be empty for air coolers");

                cooler.RuleFor(x => x.RadiatorWidthMm)
                    .Null().WithMessage("RadiatorWidthMm must be empty for air coolers");

                cooler.RuleFor(x => x.RadiatorHeightMm)
                    .Null().WithMessage("RadiatorHeightMm must be empty for air coolers");

                cooler.RuleFor(x => x.WaterBlockLengthMm)
                    .Null().WithMessage("WaterBlockLengthMm must be empty for air coolers");

                cooler.RuleFor(x => x.WaterBlockWidthMm)
                    .Null().WithMessage("WaterBlockWidthMm must be empty for air coolers");

                cooler.RuleFor(x => x.WaterBlockHeightMm)
                    .Null().WithMessage("WaterBlockHeightMm must be empty for air coolers");
            });

            cooler.When(x => x.Type == CpuCoolerType.Water, () =>
            {
                cooler.RuleFor(x => x.RadiatorClass)
                    .NotNull().WithMessage("RadiatorClass is required for liquid coolers")
                    .IsInEnum().WithMessage("RadiatorClass is invalid");

                cooler.RuleFor(x => x.RadiatorLengthMm)
                    .GreaterThan(0).When(x => x.RadiatorLengthMm is not null)
                    .WithMessage("RadiatorLengthMm must be greater than 0");

                cooler.RuleFor(x => x.RadiatorWidthMm)
                    .GreaterThan(0).When(x => x.RadiatorWidthMm is not null)
                    .WithMessage("RadiatorWidthMm must be greater than 0");

                cooler.RuleFor(x => x.RadiatorHeightMm)
                    .GreaterThan(0).When(x => x.RadiatorHeightMm is not null)
                    .WithMessage("RadiatorHeightMm must be greater than 0");

                cooler.RuleFor(x => x.WaterBlockLengthMm)
                    .GreaterThan(0).When(x => x.WaterBlockLengthMm is not null)
                    .WithMessage("WaterBlockLengthMm must be greater than 0");

                cooler.RuleFor(x => x.WaterBlockWidthMm)
                    .GreaterThan(0).When(x => x.WaterBlockWidthMm is not null)
                    .WithMessage("WaterBlockWidthMm must be greater than 0");

                cooler.RuleFor(x => x.WaterBlockHeightMm)
                    .GreaterThan(0).When(x => x.WaterBlockHeightMm is not null)
                    .WithMessage("WaterBlockHeightMm must be greater than 0");

                cooler.RuleFor(x => x.CoolerLengthMm)
                    .Null().WithMessage("CoolerLengthMm must be empty for liquid coolers");

                cooler.RuleFor(x => x.CoolerWidthMm)
                    .Null().WithMessage("CoolerWidthMm must be empty for liquid coolers");

                cooler.RuleFor(x => x.CoolerHeightMm)
                    .Null().WithMessage("CoolerHeightMm must be empty for liquid coolers");

                cooler.RuleFor(x => x.MaxRamHeightMm)
                    .Null().WithMessage("MaxRamHeightMm must be empty for liquid coolers");
            });

            cooler.RuleFor(x => x.FanThicknessMm)
                .GreaterThan(0).When(x => x.FanThicknessMm is not null)
                .WithMessage("FanThicknessMm must be greater than 0");

            cooler.RuleFor(x => x.FanWidthMm)
                .GreaterThan(0).When(x => x.FanWidthMm is not null)
                .WithMessage("FanWidthMm must be greater than 0");

            cooler.RuleFor(x => x.FanHeightMm)
                .GreaterThan(0).When(x => x.FanHeightMm is not null)
                .WithMessage("FanHeightMm must be greater than 0");

            cooler.RuleFor(x => x.FanCount)
                .GreaterThan(0).When(x => x.FanCount is not null)
                .WithMessage("FanCount must be greater than 0");
        });
    }
}
