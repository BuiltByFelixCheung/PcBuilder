using MediatR;
using PcBuilderBackend.Application.Common.Storage;

namespace PcBuilderBackend.Application.Catalog.ProductPictures.Queries;

public record GetProductPictureContentQuery(Guid Id) : IRequest<StoredObject?>;
