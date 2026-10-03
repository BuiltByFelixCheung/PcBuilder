using FluentAssertions;
using PcBuilderBackend.Domain.Entities;
using PcBuilderBackend.Domain.Enums;

namespace PcBuilderBackend.Domain.UnitTests.Entities;

public class ManufacturerTests
{
    [Fact]
    public void Constructor_trims_name()
    {
        var manufacturer = new Manufacturer("  Corsair  ");

        manufacturer.Name.Should().Be("Corsair");
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    public void Constructor_rejects_missing_name(string? name)
    {
        var act = () => new Manufacturer(name!);

        act.Should().Throw<ArgumentException>().WithParameterName(nameof(name));
    }

    [Fact]
    public void Constructor_rejects_name_over_200_characters()
    {
        var act = () => new Manufacturer(new string('A', 201));

        act.Should().Throw<ArgumentException>().WithParameterName("name");
    }

    [Fact]
    public void Rename_updates_name_and_timestamp()
    {
        var manufacturer = new Manufacturer("Corsair");

        manufacturer.Rename("Seasonic");

        manufacturer.Name.Should().Be("Seasonic");
        manufacturer.UpdatedAtUtc.Should().NotBeNull();
    }

    [Fact]
    public void SetProductTypes_stores_distinct_sorted_values()
    {
        var manufacturer = new Manufacturer("Cooler Master");

        manufacturer.SetProductTypes([ProductType.Ram, ProductType.CpuCooler, ProductType.CpuCooler]);

        manufacturer.ProductTypes.Should().Equal(ProductType.CpuCooler, ProductType.Ram);
        manufacturer.UpdatedAtUtc.Should().NotBeNull();
    }

    [Fact]
    public void SetProductTypes_rejects_undefined_values()
    {
        var manufacturer = new Manufacturer("Cooler Master");

        var act = () => manufacturer.SetProductTypes([(ProductType)int.MaxValue]);

        act.Should().Throw<ArgumentException>().WithParameterName("productTypes");
    }
}
