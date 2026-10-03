using FluentAssertions;
using PcBuilderBackend.Domain.Entities;
using PcBuilderBackend.Domain.Enums;
using PcBuilderBackend.Infrastructure.Persistence.Queries;

namespace PcBuilderBackend.Infrastructure.UnitTests.Persistence;

public class ManufacturerReadStoreTests
{
    [Fact]
    public void FilterByProductType_executes_every_defined_type()
    {
        var source = new[] { new Manufacturer("AMD") }.AsQueryable();

        foreach (var type in Enum.GetValues<ProductType>())
        {
            ManufacturerReadStore.FilterByProductType(source, type).Should().BeEmpty();
        }
    }

    [Fact]
    public void FilterByProductType_rejects_undefined_values()
    {
        var source = Array.Empty<Manufacturer>().AsQueryable();

        var act = () => ManufacturerReadStore.FilterByProductType(source, (ProductType)int.MaxValue).ToList();

        act.Should().Throw<ArgumentOutOfRangeException>()
            .WithParameterName("productType");
    }

    [Fact]
    public void FilterByProductType_matches_assigned_lines()
    {
        var manufacturer = new Manufacturer("Cooler Master");
        manufacturer.SetProductTypes([ProductType.CpuCooler]);
        var source = new[] { manufacturer }.AsQueryable();

        ManufacturerReadStore.FilterByProductType(source, ProductType.CpuCooler)
            .Should().ContainSingle()
            .Which.Should().BeSameAs(manufacturer);
        ManufacturerReadStore.FilterByProductType(source, ProductType.Ram).Should().BeEmpty();
    }
}
