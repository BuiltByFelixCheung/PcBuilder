using PcBuilderBackend.Application.Build.Dto;
using PcBuilderBackend.Application.Common.Dto;

namespace PcBuilderBackend.Application.Build;

public interface IPcBuildReadStore
{
    Task<PcBuildDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<string?> GetPictureEditTokenHashAsync(Guid id, CancellationToken cancellationToken);
    Task<PagedResult<PcBuildListItemDto>> ListPublicAsync(PagedRequest request, CancellationToken cancellationToken);
    Task<PagedResult<PcBuildListItemDto>> ListByUserAsync(PagedRequest request, CancellationToken cancellationToken);
}
