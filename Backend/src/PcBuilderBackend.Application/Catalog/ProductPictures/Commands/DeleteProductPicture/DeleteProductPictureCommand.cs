using MediatR;

namespace PcBuilderBackend.Application.Catalog.ProductPictures.Commands.DeleteProductPicture;

public record DeleteProductPictureCommand(Guid Id) : IRequest<bool>;
