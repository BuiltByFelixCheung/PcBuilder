using MediatR;
using PcBuilderBackend.Application.Build.Dto;

namespace PcBuilderBackend.Application.Build.Queries;

public record ListBuildPicturesQuery(Guid BuildId) : IRequest<List<BuildPictureDto>>;
