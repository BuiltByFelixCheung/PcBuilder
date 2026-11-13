using FluentAssertions;
using PcBuilderBackend.Domain.Entities;
using PcBuilderBackend.Domain.Enums;

namespace PcBuilderBackend.Domain.UnitTests.Catalog;

public class PsuCableTests
{
    [Fact]
    public void Constructor_sets_specs()
    {
        var psuId = Guid.NewGuid();

        var cable = new PsuCable(psuId, PsuCableType.Pcie6Plus2Pin, 4, 1);

        cable.PsuId.Should().Be(psuId);
        cable.Type.Should().Be(PsuCableType.Pcie6Plus2Pin);
        cable.CablesCount.Should().Be(4);
        cable.ConnectorsCount.Should().Be(1);
    }

    [Fact]
    public void Constructor_rejects_empty_psu_id()
    {
        var act = () => new PsuCable(Guid.Empty, PsuCableType.Sata, 1, 1);

        act.Should().Throw<ArgumentException>().WithMessage("*PSU ID*");
    }

    [Fact]
    public void Constructor_rejects_invalid_type()
    {
        var act = () => new PsuCable(Guid.NewGuid(), (PsuCableType)0, 1, 1);

        act.Should().Throw<ArgumentException>().WithMessage("*Cable Type*");
    }

    [Fact]
    public void Constructor_rejects_none()
    {
        var act = () => new PsuCable(Guid.NewGuid(), PsuCableType.None, 1, 1);

        act.Should().Throw<ArgumentException>().WithMessage("*Cable Type*");
    }

    [Theory]
    [InlineData(0, 1)]
    [InlineData(-1, 1)]
    [InlineData(1, 0)]
    [InlineData(1, -2)]
    public void Constructor_rejects_non_positive_counts(int cablesCount, int connectorsCount)
    {
        var act = () => new PsuCable(Guid.NewGuid(), PsuCableType.Sata, cablesCount, connectorsCount);

        act.Should().Throw<ArgumentOutOfRangeException>();
    }

    [Fact]
    public void UpdateSpecs_replaces_values()
    {
        var cable = new PsuCable(Guid.NewGuid(), PsuCableType.Sata, 2, 3);
        var nextPsuId = Guid.NewGuid();

        cable.UpdateSpecs(nextPsuId, PsuCableType.Molex, 3, 1);

        cable.PsuId.Should().Be(nextPsuId);
        cable.Type.Should().Be(PsuCableType.Molex);
        cable.CablesCount.Should().Be(3);
        cable.ConnectorsCount.Should().Be(1);
        cable.UpdatedAtUtc.Should().NotBeNull();
    }
}
