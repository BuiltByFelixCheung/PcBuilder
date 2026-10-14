using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.EntityFrameworkCore;
using PcBuilderBackend.Application.Catalog.ChassisFans;
using PcBuilderBackend.Application.Catalog.ChassisFans.Dto;
using PcBuilderBackend.Application.Common.Dto;
using PcBuilderBackend.Application.Common.Extensions;
using PcBuilderBackend.Domain.Entities;

namespace PcBuilderBackend.Infrastructure.Persistence.Queries;

public sealed class ChassisFanReadStore(PcBuilderDbContext db, IMapper mapper) : IChassisFanReadStore
{
    public Task<ChassisFanDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken) =>
        db.ChassisFans
            .AsNoTracking()
            .Where(x => x.Id == id)
            .ProjectTo<ChassisFanDto>(mapper.ConfigurationProvider)
            .FirstOrDefaultAsync(cancellationToken);

    public Task<PagedResult<ChassisFanDto>> ListAsync(PagedRequest request, CancellationToken cancellationToken) =>
        db.ChassisFans
            .AsNoTracking()
            .Include(x => x.Manufacturer)
            .ApplySorting(request.SortFields, request.SortDirection)
            .ToPagedResultAsync<ChassisFan, ChassisFanDto>(
                request.PageIndex,
                request.PageSize,
                mapper.ConfigurationProvider,
                cancellationToken);

    public async Task<PagedResult<ChassisFanDto>> FilterAsync(
        PagedRequest<ChassisFanFilter> request,
        CancellationToken cancellationToken)
    {
        var filter = request.Filter ?? new ChassisFanFilter();

        var queryable = db.ChassisFans.AsNoTracking()
            .WhereIf(filter.ManufacturerId.HasValue, x => x.ManufacturerId == filter.ManufacturerId)
            .WhereIf(!string.IsNullOrEmpty(filter.Name), x => x.Name.Contains(filter.Name!))
            .WhereIf(filter.DiameterMm.HasValue, x => x.DiameterMm == filter.DiameterMm)
            .WhereIf(filter.FansCountPerPack.HasValue, x => x.FansCountPerPack == filter.FansCountPerPack)
            .WhereIf(filter.HeaderType.HasValue, x => x.HeaderType == filter.HeaderType)
            .WhereIf(filter.SupportsDaisyChain.HasValue, x => x.SupportsDaisyChain == filter.SupportsDaisyChain);

        if (!filter.ChassisId.HasValue)
        {
            return await queryable
                .Include(x => x.Manufacturer)
                .ApplySorting(request.SortFields, request.SortDirection)
                .ToPagedResultAsync<ChassisFan, ChassisFanDto>(
                    request.PageIndex,
                    request.PageSize,
                    mapper.ConfigurationProvider,
                    cancellationToken);
        }

        var chassis = await db.Chassis
            .AsNoTracking()
            .Include(c => c.FanMounts)
            .ThenInclude(m => m.Options)
            .FirstOrDefaultAsync(c => c.Id == filter.ChassisId.Value, cancellationToken);

        if (chassis is null)
            return PagedResult<ChassisFanDto>.Empty(request);

        IEnumerable<ChassisFan> chassisFans = await queryable
            .Include(x => x.Manufacturer)
            .ToListAsync(cancellationToken);

        chassisFans = chassisFans.Where(chassis.CheckFanCompatibility);

        var list = chassisFans.ApplySorting(request.SortFields, request.SortDirection).ToList();

        return new PagedResult<ChassisFanDto>
        {
            Items = mapper.Map<List<ChassisFanDto>>(list
                .Skip(request.PageIndex * request.PageSize)
                .Take(request.PageSize)),
            TotalCount = list.Count,
            PageIndex = request.PageIndex,
            PageSize = request.PageSize
        };
    }
}
