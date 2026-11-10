using MediatR;

namespace PcBuilderBackend.Application.Build.Commands.DeleteBuildPicture;

public record DeleteBuildPictureCommand(Guid Id, string? EditToken = null) : IRequest<bool>;