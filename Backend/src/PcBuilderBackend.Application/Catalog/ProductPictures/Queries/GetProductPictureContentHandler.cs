using MediatR;
using PcBuilderBackend.Application.Common.Interfaces;
using PcBuilderBackend.Application.Common.Storage;

namespace PcBuilderBackend.Application.Catalog.ProductPictures.Queries;

public class GetProductPictureContentHandler(
    IProductPictureRepository pictures,
    IStorageService storage)
    : IRequestHandler<GetProductPictureContentQuery, StoredObject?>
{
    public async Task<StoredObject?> Handle(
        GetProductPictureContentQuery request,
        CancellationToken cancellationToken)
    {
        var picture = await pictures.GetByIdAsync(request.Id, cancellationToken);
        if (picture is null)
            return null;

        return await storage.OpenAsync(picture.PictureKey, cancellationToken);
    }
}
