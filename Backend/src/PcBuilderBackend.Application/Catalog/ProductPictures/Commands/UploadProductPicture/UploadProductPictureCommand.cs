using MediatR;
using PcBuilderBackend.Application.Catalog.ProductPictures.Dto;
using PcBuilderBackend.Domain.Enums;

namespace PcBuilderBackend.Application.Catalog.ProductPictures.Commands.UploadProductPicture;

public record UploadProductPictureCommand(
    ProductType ProductType,
    Guid ProductId,
    Stream Content,
    string FileName,
    string ContentType,
    long Length) : IRequest<ProductPictureDto>;
