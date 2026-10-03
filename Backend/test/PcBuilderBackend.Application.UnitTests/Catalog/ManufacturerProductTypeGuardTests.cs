using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using PcBuilderBackend.Domain.Entities;
using PcBuilderBackend.Domain.Enums;
using PcBuilderBackend.Infrastructure.Persistence;

namespace PcBuilderBackend.Application.UnitTests.Catalog;

public class ManufacturerProductTypeGuardTests
{
    [Fact]
    public void Save_rejects_a_product_whose_manufacturer_does_not_list_that_line()
    {
        using var db = CreateContext();
        var manufacturer = new Manufacturer("Kingston");
        manufacturer.SetProductTypes([ProductType.Ram]);
        db.Manufacturers.Add(manufacturer);
        db.SaveChanges();

        db.Sockets.Add(new Socket(manufacturer.Id, "AM5"));

        var act = () => db.SaveChanges();

        act.Should().Throw<ArgumentException>()
            .WithMessage("Kingston does not produce Socket.*")
            .WithParameterName("manufacturerId");
    }

    [Fact]
    public void Save_accepts_a_product_whose_manufacturer_lists_that_line()
    {
        using var db = CreateContext();
        var manufacturer = new Manufacturer("AMD");
        manufacturer.SetProductTypes([ProductType.Socket]);
        db.Manufacturers.Add(manufacturer);
        db.SaveChanges();

        db.Sockets.Add(new Socket(manufacturer.Id, "AM5"));

        var act = () => db.SaveChanges();

        act.Should().NotThrow();
        db.Sockets.Should().ContainSingle();
    }

    private static PcBuilderDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<PcBuilderDbContext>()
            .UseInMemoryDatabase($"manufacturer-lines-{Guid.NewGuid()}")
            .Options;
        return new PcBuilderDbContext(options);
    }
}
