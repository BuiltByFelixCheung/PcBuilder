using MediatR;
using PcBuilderBackend.Application.Build.Dto;

namespace PcBuilderBackend.Application.Build.Commands.UploadBuildPicture;

public record UploadBuildPictureCommand(
    Guid BuildId,
    Stream Content,
    string FileName,
    string ContentType,
    long Length) : IRequest<BuildPictureDto>;