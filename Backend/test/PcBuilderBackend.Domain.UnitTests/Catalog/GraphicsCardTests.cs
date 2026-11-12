using FluentAssertions;
using PcBuilderBackend.Domain.Entities;
using PcBuilderBackend.Domain.Enums;
using PcBuilderBackend.Domain.ValueObjects;

namespace PcBuilderBackend.Domain.UnitTests.Catalog;

public class GraphicsCardTests
{
    private static readonly Guid ManufacturerId = Guid.NewGuid();

    [Fact]
    public void Slot_powered_card_allows_zero_connectors()
    {
        var card = CreateCard(PsuCableType.None, 0);

        card.PowerConnectorType.Should().Be(PsuCableType.None);
        card.PowerConnectorCount.Should().Be(0);
    }

    [Fact]
    public void Slot_powered_card_rejects_a_connector_count()
    {
        var act = () => CreateCard(PsuCableType.None, 1);

        act.Should().Throw<ArgumentException>().WithMessage("*zero*");
    }

    [Fact]
    public void External_connector_rejects_zero_count()
    {
        var act = () => CreateCard(PsuCableType.Pcie6Pin, 0);

        act.Should().Throw<ArgumentException>().WithMessage("*greater than zero*");
    }

    [Fact]
    public void Six_pin_card_stores_one_connector()
    {
        var card = CreateCard(PsuCableType.Pcie6Pin, 1);

        card.PowerConnectorType.Should().Be(PsuCableType.Pcie6Pin);
        card.PowerConnectorCount.Should().Be(1);
    }

    private static GraphicsCard CreateCard(PsuCableType connector, int powerConnectorCount) =>
        new("RTX 3050", ManufacturerId, new GraphicsCardSpecs
        {
            GpuId = Guid.NewGuid(),
            VideoMemoryGb = 6,
            PcieSlotsUsed = 2,
            PcieGeneration = PcieGeneration.Gen4,
            IsLowProfile = false,
            LengthMm = 178,
            WidthMm = 111,
            HeightMm = 38,
            PowerConsumptionWatts = 70,
            PowerConnectorType = connector,
            PowerConnectorCount = powerConnectorCount
        });
}
