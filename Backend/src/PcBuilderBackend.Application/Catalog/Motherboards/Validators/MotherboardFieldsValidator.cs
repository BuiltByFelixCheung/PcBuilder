using FluentValidation;
using PcBuilderBackend.Application.Catalog.Motherboards;

namespace PcBuilderBackend.Application.Catalog.Motherboards.Validators;

public sealed class MotherboardFieldsValidator<T> : AbstractValidator<T>
    where T : IMotherboardFields
{
    public MotherboardFieldsValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Name is required")
            .MaximumLength(200);

        RuleFor(x => x.ManufacturerId)
            .NotEmpty().WithMessage("ManufacturerId is required");

        RuleFor(x => x.SocketId)
            .NotEmpty().WithMessage("SocketId is required");

        RuleFor(x => x.ChipsetId)
            .NotEmpty().WithMessage("ChipsetId is required");

        RuleFor(x => x.RamSlots)
            .GreaterThan(0).WithMessage("RamSlots must be greater than 0");

        RuleFor(x => x.MaxMemoryGb)
            .GreaterThan(0).WithMessage("MaxMemoryGb must be greater than 0");

        RuleFor(x => x.MaxDimmSizeGb)
            .GreaterThan(0).WithMessage("MaxDimmSizeGb must be greater than 0");

        RuleFor(x => x.SataPorts)
            .GreaterThan(0).WithMessage("SataPorts must be greater than 0");

        RuleFor(x => x.PwmFanHeaders)
            .GreaterThanOrEqualTo(0).WithMessage("PwmFanHeaders must be greater than or equal to 0");

        RuleFor(x => x.DcFanHeaders)
            .GreaterThanOrEqualTo(0).WithMessage("DcFanHeaders must be greater than or equal to 0");

        RuleFor(x => x)
            .Must(x => x.PwmFanHeaders + x.DcFanHeaders > 0)
            .WithMessage("At least one PWM or DC fan header is required");

        RuleFor(x => x.EpsConnectors)
            .GreaterThan(0).WithMessage("EpsConnectors must be greater than 0");

        RuleFor(x => x.WidthMm)
            .GreaterThan(0).WithMessage("WidthMm must be greater than 0");

        RuleFor(x => x.HeightMm)
            .GreaterThan(0).WithMessage("HeightMm must be greater than 0");

        RuleFor(x => x.DdrGeneration)
            .IsInEnum().WithMessage("DdrGeneration is invalid");

        RuleFor(x => x.RamFormFactor)
            .IsInEnum().WithMessage("RamFormFactor is invalid");

        RuleFor(x => x.FormFactor)
            .IsInEnum().WithMessage("FormFactor is invalid");
    }
}
