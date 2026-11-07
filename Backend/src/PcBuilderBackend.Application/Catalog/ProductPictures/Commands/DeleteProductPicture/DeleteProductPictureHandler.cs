using MediatR;
using Microsoft.Extensions.Logging;
using PcBuilderBackend.Application.Common.Interfaces;
using PcBuilderBackend.Application.Common.Logging;

namespace PcBuilderBackend.Application.Catalog.ProductPictures.Commands.DeleteProductPicture;

public class DeleteProductPictureHandler(
    IProductPictureRepository pictures,
    IStorageService storage,
    IUnitOfWork unitOfWork,
    ILogger<DeleteProductPictureHandler> logger)
    : IRequestHandler<DeleteProductPictureCommand, bool>
{
    public async Task<bool> Handle(DeleteProductPictureCommand request, CancellationToken cancellationToken)
    {
        var entity = await pictures.GetByIdAsync(request.Id, cancellationToken);
        if (entity is null)
        {
            EntityLog.NotFoundOrInactive(logger, EntityLog.ProductPicture, request.Id);
            return false;
        }

        await storage.DeleteAsync(entity.PictureKey, cancellationToken);
        entity.Deactivate();
        await unitOfWork.SaveChangesAsync(cancellationToken);
        EntityLog.Deleted(logger, EntityLog.ProductPicture, entity.Id);
        return true;
    }
}
