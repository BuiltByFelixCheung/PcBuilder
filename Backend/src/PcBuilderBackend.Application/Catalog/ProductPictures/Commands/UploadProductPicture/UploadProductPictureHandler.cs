using AutoMapper;
using MediatR;
using Microsoft.Extensions.Logging;
using PcBuilderBackend.Application.Catalog.ProductPictures.Dto;
using PcBuilderBackend.Application.Common.Interfaces;
using PcBuilderBackend.Application.Common.Logging;
using PcBuilderBackend.Domain.Entities;

namespace PcBuilderBackend.Application.Catalog.ProductPictures.Commands.UploadProductPicture;

public class UploadProductPictureHandler(
    IProductPictureRepository pictures,
    IStorageService storage,
    IUnitOfWork unitOfWork,
    IMapper mapper,
    ILogger<UploadProductPictureHandler> logger)
    : IRequestHandler<UploadProductPictureCommand, ProductPictureDto>
{
    public async Task<ProductPictureDto> Handle(
        UploadProductPictureCommand request,
        CancellationToken cancellationToken)
    {
        var key = await storage.UploadAsync(
            request.Content,
            request.FileName,
            request.ContentType,
            cancellationToken);
        var entity = new ProductPicture(request.ProductType, request.ProductId, key);
        pictures.Add(entity);

        try
        {
            await unitOfWork.SaveChangesAsync(cancellationToken);
        }
        catch (Exception exception)
        {
            await RemoveOrphanObject(key, exception);
            throw;
        }

        EntityLog.Created(logger, EntityLog.ProductPicture, entity.Id);
        return mapper.Map<ProductPictureDto>(entity);
    }

    private async Task RemoveOrphanObject(string key, Exception saveFailure)
    {
        try
        {
            // The request token is often already canceled. Cleanup still has to
            // delete the object that has no matching row.
            await storage.DeleteAsync(key, CancellationToken.None);
        }
        catch (Exception cleanupFailure)
        {
            EntityLog.PictureCleanupFailed(logger, cleanupFailure, key, saveFailure.Message);
        }
    }
}
