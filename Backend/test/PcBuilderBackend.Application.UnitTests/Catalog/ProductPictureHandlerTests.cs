using AutoMapper;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using PcBuilderBackend.Application.Catalog.ProductPictures;
using PcBuilderBackend.Application.Catalog.ProductPictures.Commands.DeleteProductPicture;
using PcBuilderBackend.Application.Catalog.ProductPictures.Commands.UploadProductPicture;
using PcBuilderBackend.Application.Catalog.ProductPictures.Dto;
using PcBuilderBackend.Application.Catalog.ProductPictures.Queries;
using PcBuilderBackend.Application.Catalog.ProductPictures.Validators;
using PcBuilderBackend.Application.Common.Interfaces;
using PcBuilderBackend.Application.Common.Storage;
using PcBuilderBackend.Domain.Entities;
using PcBuilderBackend.Domain.Enums;

namespace PcBuilderBackend.Application.UnitTests.Catalog;

public class ProductPictureHandlerTests
{
    private readonly IProductPictureRepository _pictures = Substitute.For<IProductPictureRepository>();
    private readonly IProductPictureReadStore _store = Substitute.For<IProductPictureReadStore>();
    private readonly IStorageService _storage = Substitute.For<IStorageService>();
    private readonly IUnitOfWork _unitOfWork = Substitute.For<IUnitOfWork>();
    private readonly IMapper _mapper = Substitute.For<IMapper>();

    [Fact]
    public async Task Upload_saves_the_row_with_the_storage_key()
    {
        var productId = Guid.NewGuid();
        _storage.UploadAsync(
                Arg.Any<Stream>(),
                "cpu.jpg",
                "image/jpeg",
                Arg.Any<CancellationToken>())
            .Returns("pc-builder/cpu.jpg");
        _mapper.Map<ProductPictureDto>(Arg.Any<ProductPicture>())
            .Returns(call =>
            {
                var picture = call.Arg<ProductPicture>();
                return new ProductPictureDto(picture.Id, picture.ProductType, picture.ProductId);
            });

        await using var content = new MemoryStream([1, 2, 3]);
        var result = await new UploadProductPictureHandler(
                _pictures,
                _storage,
                _unitOfWork,
                _mapper,
                NullLogger<UploadProductPictureHandler>.Instance)
            .Handle(
                new UploadProductPictureCommand(
                    ProductType.Cpu,
                    productId,
                    content,
                    "cpu.jpg",
                    "image/jpeg",
                    content.Length),
                CancellationToken.None);

        result.ProductType.Should().Be(ProductType.Cpu);
        result.ProductId.Should().Be(productId);
        await _unitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
        _pictures.Received(1).Add(Arg.Is<ProductPicture>(picture =>
            picture.PictureKey == "pc-builder/cpu.jpg"
            && picture.ProductId == productId
            && picture.IsActive));
    }

    [Fact]
    public async Task Upload_removes_the_object_when_the_row_cannot_be_saved()
    {
        _storage.UploadAsync(
                Arg.Any<Stream>(),
                "cpu.jpg",
                "image/jpeg",
                Arg.Any<CancellationToken>())
            .Returns("pc-builder/cpu.jpg");
        _unitOfWork.SaveChangesAsync(Arg.Any<CancellationToken>())
            .ThrowsAsync(new InvalidOperationException("database"));

        await using var content = new MemoryStream([1]);
        var act = async () => await new UploadProductPictureHandler(
                _pictures,
                _storage,
                _unitOfWork,
                _mapper,
                NullLogger<UploadProductPictureHandler>.Instance)
            .Handle(
                new UploadProductPictureCommand(
                    ProductType.Cpu,
                    Guid.NewGuid(),
                    content,
                    "cpu.jpg",
                    "image/jpeg",
                    content.Length),
                CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>();
        await _storage.Received(1).DeleteAsync("pc-builder/cpu.jpg", Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Delete_removes_the_object_then_deactivates_the_row()
    {
        var picture = new ProductPicture(ProductType.Psu, Guid.NewGuid(), "pc-builder/psu.png");
        _pictures.GetByIdAsync(picture.Id, Arg.Any<CancellationToken>()).Returns(picture);

        var deleted = await new DeleteProductPictureHandler(
                _pictures,
                _storage,
                _unitOfWork,
                NullLogger<DeleteProductPictureHandler>.Instance)
            .Handle(new DeleteProductPictureCommand(picture.Id), CancellationToken.None);

        deleted.Should().BeTrue();
        picture.IsActive.Should().BeFalse();
        await _storage.Received(1).DeleteAsync("pc-builder/psu.png", Arg.Any<CancellationToken>());
        await _unitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Delete_of_a_missing_picture_does_not_touch_storage()
    {
        var id = Guid.NewGuid();
        _pictures.GetByIdAsync(id, Arg.Any<CancellationToken>()).Returns((ProductPicture?)null);

        var deleted = await new DeleteProductPictureHandler(
                _pictures,
                _storage,
                _unitOfWork,
                NullLogger<DeleteProductPictureHandler>.Instance)
            .Handle(new DeleteProductPictureCommand(id), CancellationToken.None);

        deleted.Should().BeFalse();
        await _storage.DidNotReceive().DeleteAsync(Arg.Any<string>(), Arg.Any<CancellationToken>());
        await _unitOfWork.DidNotReceive().SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Delete_leaves_the_row_active_when_storage_removal_fails()
    {
        var picture = new ProductPicture(ProductType.Ram, Guid.NewGuid(), "pc-builder/ram.webp");
        _pictures.GetByIdAsync(picture.Id, Arg.Any<CancellationToken>()).Returns(picture);
        _storage.DeleteAsync(picture.PictureKey, Arg.Any<CancellationToken>())
            .ThrowsAsync(new InvalidOperationException("storage"));

        var act = async () => await new DeleteProductPictureHandler(
                _pictures,
                _storage,
                _unitOfWork,
                NullLogger<DeleteProductPictureHandler>.Instance)
            .Handle(new DeleteProductPictureCommand(picture.Id), CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>();
        picture.IsActive.Should().BeTrue();
        await _unitOfWork.DidNotReceive().SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task List_reads_pictures_for_the_product()
    {
        var productId = Guid.NewGuid();
        var expected = new List<ProductPictureDto>
        {
            new(Guid.NewGuid(), ProductType.Motherboard, productId)
        };
        _store.ListByProductAsync(ProductType.Motherboard, productId, Arg.Any<CancellationToken>())
            .Returns(expected);

        var result = await new ListProductPicturesHandler(_store)
            .Handle(new ListProductPicturesQuery(ProductType.Motherboard, productId), CancellationToken.None);

        result.Should().BeSameAs(expected);
    }

    [Fact]
    public async Task Content_opens_the_object_for_the_picture_key()
    {
        var picture = new ProductPicture(ProductType.Chassis, Guid.NewGuid(), "pc-builder/chassis.gif");
        await using var stream = new MemoryStream([9]);
        var stored = new StoredObject(stream, "image/gif", stream);
        _pictures.GetByIdAsync(picture.Id, Arg.Any<CancellationToken>()).Returns(picture);
        _storage.OpenAsync(picture.PictureKey, Arg.Any<CancellationToken>()).Returns(stored);

        var result = await new GetProductPictureContentHandler(_pictures, _storage)
            .Handle(new GetProductPictureContentQuery(picture.Id), CancellationToken.None);

        result.Should().BeSameAs(stored);
        result!.ContentType.Should().Be("image/gif");
    }

    [Fact]
    public async Task Content_of_a_missing_picture_does_not_open_storage()
    {
        var id = Guid.NewGuid();
        _pictures.GetByIdAsync(id, Arg.Any<CancellationToken>()).Returns((ProductPicture?)null);

        var result = await new GetProductPictureContentHandler(_pictures, _storage)
            .Handle(new GetProductPictureContentQuery(id), CancellationToken.None);

        result.Should().BeNull();
        await _storage.DidNotReceive().OpenAsync(Arg.Any<string>(), Arg.Any<CancellationToken>());
    }
}

public class ProductPictureValidatorTests
{
    [Fact]
    public async Task Upload_accepts_an_image_for_an_active_product()
    {
        var productId = Guid.NewGuid();
        var products = Substitute.For<IProductExistenceLookup>();
        products.ExistsAsync(ProductType.Cpu, productId, Arg.Any<CancellationToken>()).Returns(true);
        await using var content = new MemoryStream([1, 2]);

        var result = await new UploadProductPictureCommandValidator(products).ValidateAsync(
            new UploadProductPictureCommand(
                ProductType.Cpu,
                productId,
                content,
                "cpu.jpg",
                "image/jpeg",
                content.Length));

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public async Task Upload_rejects_a_missing_product_and_a_non_image()
    {
        var productId = Guid.NewGuid();
        var products = Substitute.For<IProductExistenceLookup>();
        products.ExistsAsync(ProductType.Cpu, productId, Arg.Any<CancellationToken>()).Returns(false);
        await using var content = new MemoryStream([1]);

        var result = await new UploadProductPictureCommandValidator(products).ValidateAsync(
            new UploadProductPictureCommand(
                ProductType.Cpu,
                productId,
                content,
                "notes.txt",
                "text/plain",
                content.Length));

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(error => error.PropertyName == "File");
        result.Errors.Should().Contain(error => error.PropertyName == "ProductId");
    }

    [Fact]
    public async Task Upload_rejects_an_empty_file()
    {
        var products = Substitute.For<IProductExistenceLookup>();
        await using var content = new MemoryStream();

        var result = await new UploadProductPictureCommandValidator(products).ValidateAsync(
            new UploadProductPictureCommand(
                (ProductType)(-1),
                Guid.Empty,
                content,
                "",
                "",
                0));

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(error => error.PropertyName == nameof(UploadProductPictureCommand.ProductType));
        result.Errors.Should().Contain(error => error.PropertyName == nameof(UploadProductPictureCommand.ProductId));
        result.Errors.Should().Contain(error => error.PropertyName == nameof(UploadProductPictureCommand.Length));
        await products.DidNotReceive()
            .ExistsAsync(Arg.Any<ProductType>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>());
    }
}
