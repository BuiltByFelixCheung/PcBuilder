using FluentAssertions;
using PcBuilderBackend.Application.Catalog.Psus.Commands.BulkCreatePsus;
using PcBuilderBackend.Application.Catalog.Psus.Commands.BulkDeletePsus;
using PcBuilderBackend.Application.Catalog.Psus.Commands.BulkUpdatePsuCables;
using PcBuilderBackend.Application.Catalog.Psus.Commands.BulkUpdatePsus;
using PcBuilderBackend.Application.Catalog.Psus.Commands.CreatePsu;
using PcBuilderBackend.Application.Catalog.Psus.Commands.DeletePsu;
using PcBuilderBackend.Application.Catalog.Psus.Commands.UpdatePsu;
using PcBuilderBackend.Application.Catalog.Psus.Dto;
using PcBuilderBackend.Application.Catalog.Psus.Validators;
using PcBuilderBackend.Application.UnitTests.Support;
using PcBuilderBackend.Domain.Enums;

namespace PcBuilderBackend.Application.UnitTests.Catalog.Psus;

public class PsuValidatorTests : IDisposable
{
    private readonly PsuCatalogFixture _fixture = new();

    public void Dispose()
    {
        Dispose(true);
        GC.SuppressFinalize(this);
    }

    protected virtual void Dispose(bool disposing)
    {
        if (disposing)
            _fixture.Dispose();
    }

    [Fact]
    public async Task Create_accepts_a_valid_command()
    {
        var validator = new CreatePsuCommandValidator(_fixture.Lookup);

        var result = await validator.ValidateAsync(_fixture.ValidCreate());

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public async Task Create_rejects_empty_name_and_non_positive_wattage()
    {
        var validator = new CreatePsuCommandValidator(_fixture.Lookup);
        var command = _fixture.ValidCreate() with { Name = "", Wattage = 0 };

        var result = await validator.ValidateAsync(command);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(CreatePsuCommand.Name));
        result.Errors.Should().Contain(e => e.PropertyName == nameof(CreatePsuCommand.Wattage));
    }

    [Fact]
    public async Task Create_rejects_unknown_manufacturer()
    {
        var validator = new CreatePsuCommandValidator(_fixture.Lookup);
        var command = _fixture.ValidCreate() with { ManufacturerId = Guid.NewGuid() };

        var result = await validator.ValidateAsync(command);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage.Contains("Manufacturer"));
    }

    [Fact]
    public async Task Create_rejects_inactive_manufacturer()
    {
        _fixture.Manufacturer.Deactivate();
        await _fixture.Context.SaveChangesAsync();
        var validator = new CreatePsuCommandValidator(_fixture.Lookup);

        var result = await validator.ValidateAsync(_fixture.ValidCreate());

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage.Contains("Manufacturer"));
    }

    [Fact]
    public async Task Create_rejects_invalid_enums_and_duplicate_cables()
    {
        var validator = new CreatePsuCommandValidator(_fixture.Lookup);
        var command = _fixture.ValidCreate() with
        {
            FormFactor = (PsuFormFactor)0,
            Modularity = (PsuModularity)99,
            Cables =
            [
                new PsuCableDto { Type = PsuCableType.Sata, CablesCount = 1, ConnectorsCount = 1 },
                new PsuCableDto { Type = PsuCableType.Sata, CablesCount = 2, ConnectorsCount = 2 }
            ]
        };

        var result = await validator.ValidateAsync(command);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(CreatePsuCommand.FormFactor));
        result.Errors.Should().Contain(e => e.PropertyName == nameof(CreatePsuCommand.Modularity));
        result.Errors.Should().Contain(e => e.ErrorMessage.Contains("Duplicate"));
    }

    [Fact]
    public async Task Create_rejects_none_cable_type()
    {
        var validator = new CreatePsuCommandValidator(_fixture.Lookup);
        var command = _fixture.ValidCreate() with
        {
            Cables = [new PsuCableDto { Type = PsuCableType.None, CablesCount = 1, ConnectorsCount = 1 }]
        };

        var result = await validator.ValidateAsync(command);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage.Contains("None"));
    }

    [Fact]
    public async Task Create_rejects_non_positive_cable_counts()
    {
        var validator = new CreatePsuCommandValidator(_fixture.Lookup);
        var command = _fixture.ValidCreate() with
        {
            Cables = [new PsuCableDto { Type = PsuCableType.Sata, CablesCount = 0, ConnectorsCount = 0 }]
        };

        var result = await validator.ValidateAsync(command);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName.Contains(nameof(PsuCableDto.CablesCount)));
        result.Errors.Should().Contain(e => e.PropertyName.Contains(nameof(PsuCableDto.ConnectorsCount)));
    }

    [Fact]
    public void Update_rejects_empty_id()
    {
        var result = new UpdatePsuCommandValidator().Validate(new UpdatePsuCommand
        {
            Name = "RM850x",
            ManufacturerId = Guid.NewGuid(),
            Wattage = 850,
            Modularity = PsuModularity.FullModular,
            FormFactor = PsuFormFactor.Atx,
            LengthMm = 160,
            WidthMm = 150,
            HeightMm = 86
        });

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(UpdatePsuCommand.Id));
    }

    [Fact]
    public void Delete_rejects_empty_id()
    {
        var result = new DeletePsuCommandValidator().Validate(new DeletePsuCommand(Guid.Empty));

        result.IsValid.Should().BeFalse();
    }

    [Fact]
    public async Task Bulk_create_rejects_empty_list_and_unknown_manufacturer()
    {
        var validator = new BulkCreatePsusCommandValidator(_fixture.Lookup);

        (await validator.ValidateAsync(new BulkCreatePsusCommand([]))).IsValid.Should().BeFalse();

        var invalid = new BulkCreatePsusCommand(
        [
            new CreatePsuItem
            {
                Name = "RM850x",
                ManufacturerId = Guid.NewGuid(),
                Wattage = 850,
                Modularity = PsuModularity.FullModular,
                FormFactor = PsuFormFactor.Atx,
                LengthMm = 160,
                WidthMm = 150,
                HeightMm = 86
            }
        ]);

        var result = await validator.ValidateAsync(invalid);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage.Contains("manufacturer"));
    }

    [Fact]
    public void Bulk_update_rejects_empty_list()
    {
        var result = new BulkUpdatePsusCommandValidator().Validate(new BulkUpdatePsusCommand([]));

        result.IsValid.Should().BeFalse();
    }

    [Fact]
    public void Bulk_delete_rejects_empty_ids()
    {
        var result = new BulkDeletePsusCommandValidator().Validate(new BulkDeletePsusCommand([]));

        result.IsValid.Should().BeFalse();
    }

    [Fact]
    public void Bulk_update_cables_rejects_empty_psu_id_and_duplicate_types()
    {
        var validator = new BulkUpdatePsuCablesCommandValidator();

        validator.Validate(new BulkUpdatePsuCablesCommand(Guid.Empty, [])).IsValid.Should().BeFalse();

        var result = validator.Validate(new BulkUpdatePsuCablesCommand(
            Guid.NewGuid(),
            [
                new PsuCableDto { Type = PsuCableType.Sata, CablesCount = 1, ConnectorsCount = 1 },
                new PsuCableDto { Type = PsuCableType.Sata, CablesCount = 2, ConnectorsCount = 2 }
            ]));

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage.Contains("Duplicate"));
    }
}
