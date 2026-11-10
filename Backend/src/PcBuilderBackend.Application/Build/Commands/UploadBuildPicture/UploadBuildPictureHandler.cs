using AutoMapper;
using MediatR;
using Microsoft.Extensions.Logging;
using PcBuilderBackend.Application.Build.Dto;
using PcBuilderBackend.Application.Common.Interfaces;
using PcBuilderBackend.Application.Common.Logging;
using PcBuilderBackend.Application.Common.Storage;
using PcBuilderBackend.Domain.Entities;

namespace PcBuilderBackend.Application.Build.Commands.UploadBuildPicture;

public class UploadBuildPictureHandler(
    IBuildPictureRepository pictures,
    IPcBuildReadStore builds,
    IStorageService storage,
    IUnitOfWork unitOfWork,
    IMapper mapper,
    ICurrentUser currentUser,
    ILogger<UploadBuildPictureHandler> logger)
    : IRequestHandler<UploadBuildPictureCommand, BuildPictureDto>
{
    public async Task<BuildPictureDto> Handle(
        UploadBuildPictureCommand request,
        CancellationToken cancellationToken)
    {
        var build = await builds.GetByIdAsync(request.BuildId, cancellationToken);
        if (build is null || !BuildAccess.IsVisible(build, currentUser.UserId))
        {
            EntityLog.NotFound(logger, EntityLog.PcBuild, request.BuildId);
            throw new KeyNotFoundException("Build was not found.");
        }

        if (!await BuildPictureAccess.CanManageAsync(
                build,
                currentUser.UserId,
                request.EditToken,
                builds,
                cancellationToken))
        {
            EntityLog.NotAuthorized(logger, EntityLog.PcBuild, request.BuildId);
            throw new UnauthorizedAccessException();
        }

        var key = await storage.UploadAsync(
            request.Content,
            request.FileName,
            request.ContentType,
            cancellationToken);

        var entity = new BuildPicture(request.BuildId, key);
        pictures.Add(entity);

        try
        {
            await unitOfWork.SaveChangesAsync(cancellationToken);
        }
        catch (Exception exception)
        {
            await storage.RemoveOrphanObject(logger, key, exception);
            throw;
        }

        EntityLog.Created(logger, EntityLog.BuildPicture, entity.Id);
        return mapper.Map<BuildPictureDto>(entity);
    }
}
