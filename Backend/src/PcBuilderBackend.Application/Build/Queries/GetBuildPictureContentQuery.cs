using MediatR;
using PcBuilderBackend.Application.Common.Storage;

namespace PcBuilderBackend.Application.Build.Queries;

public record GetBuildPictureContentQuery(Guid Id) : IRequest<StoredObject?>;
