using FluentAssertions;
using PcBuilderBackend.Application.Catalog.GraphicsCards.Commands.CreateGraphicsCard;
using PcBuilderBackend.Application.Catalog.GraphicsCards.Validators;
using PcBuilderBackend.Domain.Enums;

namespace PcBuilderBackend.Application.UnitTests.Catalog;

public class GraphicsCardFieldsValidatorTests
{
    private readonly GraphicsCardFieldsValidator<CreateGraphicsCardCommand> _validator = new();

    [Fact]
    public void Accepts_a_slot_powered_card()
    {
        var result = _validator.Validate(Card(PsuCableType.None, 0));

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void Accepts_a_six_pin_card()
    {
        var result = _validator.Validate(Card(PsuCableType.Pcie6Pin, 1));

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void Rejects_a_connector_count_on_a_slot_powered_card()
    {
        var result = _validator.Validate(Card(PsuCableType.None, 1));

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(CreateGraphicsCardCommand.PowerConnectorCount));
    }

    [Fact]
    public void Rejects_zero_connectors_on_an_external_power_card()
    {
        var result = _validator.Validate(Card(PsuCableType.Pcie6Pin, 0));

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(CreateGraphicsCardCommand.PowerConnectorCount));
    }

    private static CreateGraphicsCardCommand Card(PsuCableType connector, int powerConnectorCount) =>
        new()
        {
            Name = "RTX 3050",
            ManufacturerId = Guid.NewGuid(),
            GpuId = Guid.NewGuid(),
            VideoMemoryGb = 6,
            PcieSlotsUsed = 2,
            PcieGeneration = PcieGeneration.Gen4,
            LengthMm = 178,
            WidthMm = 111,
            HeightMm = 38,
            PowerConsumptionWatts = 70,
            PowerConnectorType = connector,
            PowerConnectorCount = powerConnectorCount
        };
}
