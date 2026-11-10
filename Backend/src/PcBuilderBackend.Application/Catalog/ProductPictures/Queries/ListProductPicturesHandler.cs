using MediatR;
using PcBuilderBackend.Application.Catalog.ProductPictures.Dto;

namespace PcBuilderBackend.Application.Catalog.ProductPictures.Queries;

public class ListProductPicturesHandler(IProductPictureReadStore store)
    : IRequestHandler<ListProductPicturesQuery, List<ProductPictureDto>>
{
    public Task<List<ProductPictureDto>> Handle(
        ListProductPicturesQuery request,
        CancellationToken cancellationToken) =>
        store.ListByProductAsync(request.ProductType, request.ProductId, cancellationToken);
}
