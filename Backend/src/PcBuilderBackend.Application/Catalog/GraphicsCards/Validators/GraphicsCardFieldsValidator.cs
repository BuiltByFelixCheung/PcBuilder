using FluentValidation;
using PcBuilderBackend.Application.Catalog.GraphicsCards;
using PcBuilderBackend.Domain.Enums;

namespace PcBuilderBackend.Application.Catalog.GraphicsCards.Validators;

public sealed class GraphicsCardFieldsValidator<T> : AbstractValidator<T>
    where T : IGraphicsCardFields
{
    public GraphicsCardFieldsValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.ManufacturerId).NotEmpty();
        RuleFor(x => x.GpuId).NotEmpty();
        RuleFor(x => x.VideoMemoryGb).GreaterThan(0);
        RuleFor(x => x.PcieSlotsUsed).GreaterThan(0);
        RuleFor(x => x.PcieGeneration).IsInEnum();
        RuleFor(x => x.LengthMm).GreaterThan(0);
        RuleFor(x => x.WidthMm).GreaterThan(0);
        RuleFor(x => x.HeightMm).GreaterThan(0);
        RuleFor(x => x.PowerConsumptionWatts).GreaterThan(0);
        RuleFor(x => x.PowerConnectorType).IsInEnum();
        RuleFor(x => x.PowerConnectorCount)
            .Equal(0)
            .When(x => x.PowerConnectorType == PsuCableType.None)
            .WithMessage("PowerConnectorCount must be zero when no external power connector is required.");
        RuleFor(x => x.PowerConnectorCount)
            .GreaterThan(0)
            .When(x => x.PowerConnectorType != PsuCableType.None)
            .WithMessage("PowerConnectorCount must be greater than zero.");
    }
}
