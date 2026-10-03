using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;
using PcBuilderBackend.Application.MasterData.Chipsets.Commands.CreateChipset;
using PcBuilderBackend.Application.MasterData.CpuSeries.Commands.CreateCpuSeries;
using PcBuilderBackend.Application.MasterData.Gpus.Commands.CreateGpu;
using PcBuilderBackend.Application.MasterData.Gpus.Dto;
using PcBuilderBackend.Application.MasterData.Gpus.Validators;
using PcBuilderBackend.Application.MasterData.GpuSeries.Commands.CreateGpuSeries;
using PcBuilderBackend.Application.MasterData.Chipsets.Validators;
using PcBuilderBackend.Application.MasterData.Manufacturers;
using PcBuilderBackend.Application.MasterData.Manufacturers.Commands.CreateManufacturer;
using PcBuilderBackend.Application.MasterData.Manufacturers.Commands.DeleteManufacturer;
using PcBuilderBackend.Application.MasterData.Manufacturers.Dto;
using PcBuilderBackend.Application.MasterData.Manufacturers.Queries;
using PcBuilderBackend.Application.MasterData.Manufacturers.Validators;
using PcBuilderBackend.Application.MasterData.Sockets.Commands.CreateSocket;
using PcBuilderBackend.Application.MasterData.Sockets.Validators;
using PcBuilderBackend.Application.UnitTests.Support;
using PcBuilderBackend.Domain.Entities;
using PcBuilderBackend.Domain.Enums;

namespace PcBuilderBackend.Application.UnitTests.MasterData;

public class MasterDataTests : IDisposable
{
    private readonly AppFixture _fx = new();

    public void Dispose()
    {
        Dispose(true);
        GC.SuppressFinalize(this);
    }

    protected virtual void Dispose(bool disposing)
    {
        if (disposing)
            _fx.Dispose();
    }

    [Fact]
    public void Manufacturer_validator_rejects_empty_and_overlong_names()
    {
        var validator = new CreateManufacturerCommandValidator();
        validator.Validate(new CreateManufacturerCommand("")).IsValid.Should().BeFalse();
        validator.Validate(new CreateManufacturerCommand(new string('A', 201))).IsValid.Should().BeFalse();
        validator.Validate(new CreateManufacturerCommand("Corsair")).IsValid.Should().BeTrue();
    }

    [Fact]
    public async Task Create_and_delete_manufacturer_use_soft_delete()
    {
        var created = await new CreateManufacturerHandler(
                new TestRepository<Manufacturer>(_fx.Context),
                NullLogger<CreateManufacturerHandler>.Instance,
                _fx.UnitOfWork,
                _fx.Mapper,
                _fx.Cache)
            .Handle(new CreateManufacturerCommand("Intel", [ProductType.Cpu, ProductType.Cpu]), CancellationToken.None);

        created.Name.Should().Be("Intel");
        created.ProductTypes.Should().Equal(ProductType.Cpu);
        (await _fx.Context.Manufacturers.CountAsync()).Should().Be(2);

        (await new DeleteManufacturerHandler(
                new TestRepository<Manufacturer>(_fx.Context),
                NullLogger<DeleteManufacturerHandler>.Instance,
                _fx.UnitOfWork,
                _fx.Cache)
            .Handle(new DeleteManufacturerCommand(created.Id), CancellationToken.None)).Should().BeTrue();
        (await _fx.Context.Manufacturers.AnyAsync(x => x.Id == created.Id)).Should().BeFalse();
        (await new DeleteManufacturerHandler(
                new TestRepository<Manufacturer>(_fx.Context),
                NullLogger<DeleteManufacturerHandler>.Instance,
                _fx.UnitOfWork,
                _fx.Cache)
            .Handle(new DeleteManufacturerCommand(Guid.NewGuid()), CancellationToken.None)).Should().BeFalse();
    }

    [Fact]
    public async Task Get_manufacturers_returns_active_rows()
    {
        var list = await new GetManufacturersHandler(
                new TestReadStore<Manufacturer, ManufacturerDto>(_fx.Context, _fx.Mapper),
                _fx.Cache)
            .Handle(new GetManufacturersQuery(), CancellationToken.None);

        list.Should().Contain(x => x.Name == "AMD");
    }

    [Fact]
    public async Task Get_manufacturers_by_product_type_delegates_to_read_store()
    {
        var store = Substitute.For<IManufacturerReadStore>();
        var expected = new List<ManufacturerDto> { new(_fx.Manufacturer.Id, "AMD") };
        store.ListByProductTypeAsync(ProductType.Cpu, Arg.Any<CancellationToken>()).Returns(expected);

        var result = await new GetManufacturersByProductTypeHandler(store)
            .Handle(new GetManufacturersByProductTypeQuery(ProductType.Cpu), CancellationToken.None);

        result.Should().BeSameAs(expected);
        await store.Received(1).ListByProductTypeAsync(ProductType.Cpu, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Socket_validator_requires_active_manufacturer()
    {
        var validator = new CreateSocketCommandValidator(_fx.Lookup);
        (await validator.ValidateAsync(new CreateSocketCommand(Guid.NewGuid(), "AM5"))).IsValid.Should().BeFalse();
        (await validator.ValidateAsync(new CreateSocketCommand(_fx.Manufacturer.Id, "AM5"))).IsValid.Should().BeTrue();
    }

    [Fact]
    public async Task Create_socket_and_chipset()
    {
        var socket = await new CreateSocketHandler(
                new TestRepository<Socket>(_fx.Context),
                NullLogger<CreateSocketHandler>.Instance,
                _fx.UnitOfWork,
                _fx.Mapper,
                _fx.Cache)
            .Handle(new CreateSocketCommand(_fx.Manufacturer.Id, "LGA1700"), CancellationToken.None);
        socket.Name.Should().Be("LGA1700");

        var chipsetValidator = new CreateChipsetCommandValidator(_fx.Lookup);
        (await chipsetValidator.ValidateAsync(new CreateChipsetCommand("Z790", _fx.Manufacturer.Id, socket.Id)))
            .IsValid.Should().BeTrue();
        (await chipsetValidator.ValidateAsync(new CreateChipsetCommand("", Guid.NewGuid(), Guid.NewGuid())))
            .IsValid.Should().BeFalse();

        var chipset = await new CreateChipsetHandler(
                new TestRepository<Chipset>(_fx.Context),
                NullLogger<CreateChipsetHandler>.Instance,
                _fx.UnitOfWork,
                _fx.Mapper,
                _fx.Cache)
            .Handle(new CreateChipsetCommand("Z790", _fx.Manufacturer.Id, socket.Id), CancellationToken.None);
        chipset.Name.Should().Be("Z790");
        (await _fx.Context.Chipsets.CountAsync(x => x.Name == "Z790")).Should().Be(1);
    }

    [Fact]
    public async Task Create_cpu_series_gpu_series_and_gpu()
    {
        var cpuSeries = await new CreateCpuSeriesHandler(
                new TestRepository<CpuSeries>(_fx.Context),
                _fx.UnitOfWork,
                _fx.Mapper,
                _fx.Cache)
            .Handle(new CreateCpuSeriesCommand("Ryzen 9000", _fx.Manufacturer.Id, _fx.Socket.Id), CancellationToken.None);
        cpuSeries.Name.Should().Be("Ryzen 9000");

        var gpuSeries = await new CreateGpuSeriesHandler(
                new TestRepository<GpuSeries>(_fx.Context),
                NullLogger<CreateGpuSeriesHandler>.Instance,
                _fx.UnitOfWork,
                _fx.Mapper,
                _fx.Cache)
            .Handle(new CreateGpuSeriesCommand(_fx.Manufacturer.Id, "RTX 50"), CancellationToken.None);
        gpuSeries.Name.Should().Be("RTX 50");

        var gpuValidator = new CreateGpuCommandValidator(_fx.Lookup);
        (await gpuValidator.ValidateAsync(new CreateGpuCommand(_fx.Manufacturer.Id, gpuSeries.Id, "RTX 5070")))
            .IsValid.Should().BeTrue();
        (await gpuValidator.ValidateAsync(new CreateGpuCommand(Guid.NewGuid(), Guid.NewGuid(), "")))
            .IsValid.Should().BeFalse();

        _fx.Context.Gpus.Add(new Gpu("RTX 5070", _fx.Manufacturer.Id, gpuSeries.Id));
        await _fx.Context.SaveChangesAsync();
        (await _fx.Context.Gpus.AnyAsync(x => x.Name == "RTX 5070")).Should().BeTrue();
    }

    [Fact]
    public void Map_gpu_to_dto_uses_series_id()
    {
        var dto = _fx.Mapper.Map<GpuDto>(_fx.Gpu);

        dto.Id.Should().Be(_fx.Gpu.Id);
        dto.Name.Should().Be("RTX 4070");
        dto.ManufacturerId.Should().Be(_fx.Manufacturer.Id);
        dto.ManufacturerName.Should().Be("AMD");
        dto.GpuSeriesId.Should().Be(_fx.GpuSeries.Id);
        dto.GpuSeriesName.Should().Be("GeForce RTX 40");
    }
}
