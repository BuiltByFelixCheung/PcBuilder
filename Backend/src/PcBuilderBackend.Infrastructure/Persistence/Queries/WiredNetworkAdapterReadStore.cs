using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.EntityFrameworkCore;
using PcBuilderBackend.Application.Catalog.WiredNetworkAdapters;
using PcBuilderBackend.Application.Catalog.WiredNetworkAdapters.Dto;
using PcBuilderBackend.Application.Common.Dto;
using PcBuilderBackend.Application.Common.Extensions;
using PcBuilderBackend.Domain.Entities;
using PcBuilderBackend.Domain.Enums;

namespace PcBuilderBackend.Infrastructure.Persistence.Queries;

public sealed class WiredNetworkAdapterReadStore(PcBuilderDbContext db, IMapper mapper)
    : IWiredNetworkAdapterReadStore
{
    public Task<WiredNetworkAdapterDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken) =>
        db.WiredNetworkAdapters
            .AsNoTracking()
            .Where(x => x.Id == id)
            .ProjectTo<WiredNetworkAdapterDto>(mapper.ConfigurationProvider)
            .FirstOrDefaultAsync(cancellationToken);

    public Task<PagedResult<WiredNetworkAdapterDto>> ListAsync(
        PagedRequest request,
        CancellationToken cancellationToken) =>
        db.WiredNetworkAdapters
            .AsNoTracking()
            .Include(x => x.Manufacturer)
            .ApplySorting(request.SortFields, request.SortDirection)
            .ToPagedResultAsync<WiredNetworkAdapter, WiredNetworkAdapterDto>(
                request.PageIndex,
                request.PageSize,
                mapper.ConfigurationProvider,
                cancellationToken);

    public async Task<PagedResult<WiredNetworkAdapterDto>> FilterAsync(
        PagedRequest<WiredNetworkAdapterFilter> request,
        CancellationToken cancellationToken)
    {
        var filter = request.Filter ?? new WiredNetworkAdapterFilter();

        var queryable = db.WiredNetworkAdapters.AsNoTracking()
            .Include(x => x.Manufacturer)
            .WhereIfHasText(filter.Name, name => x => x.Name.Contains(name))
            .WhereIf(filter.ManufacturerId.HasValue, x => x.ManufacturerId == filter.ManufacturerId)
            .WhereIf(filter.HostInterface.HasValue, x => x.HostInterface == filter.HostInterface)
            .WhereIf(filter.MaxSpeedMbps, range =>
                x => x.MaxSpeedMbps >= range.Min && x.MaxSpeedMbps <= range.Max)
            .WhereIf(filter.UsbVersion.HasValue, x => x.UsbVersion == filter.UsbVersion)
            .WhereIf(filter.UsbType.HasValue, x => x.UsbType == filter.UsbType)
            .WhereIf(filter.PcieSlotType.HasValue, x => x.PcieSlotType == filter.PcieSlotType);

        if (!filter.MotherboardId.HasValue)
        {
            return await queryable
                .ApplySorting(request.SortFields, request.SortDirection)
                .ToPagedResultAsync<WiredNetworkAdapter, WiredNetworkAdapterDto>(
                    request.PageIndex,
                    request.PageSize,
                    mapper.ConfigurationProvider,
                    cancellationToken);
        }

        var motherboard = await db.Motherboards
            .AsNoTracking()
            .Include(m => m.PcieSlots)
            .Include(m => m.UsbPorts)
            .AsSplitQuery()
            .FirstOrDefaultAsync(m => m.Id == filter.MotherboardId.Value, cancellationToken);

        if (motherboard is null)
            return PagedResult<WiredNetworkAdapterDto>.Empty(request);

        var adapters = (await queryable.ToListAsync(cancellationToken))
            .Where(x => motherboard.CheckWiredNetworkAdapterCompatibility(x).Status != PartsCompatibility.Incompatible)
            .ApplySorting(request.SortFields, request.SortDirection)
            .ToList();

        return new PagedResult<WiredNetworkAdapterDto>
        {
            PageIndex = request.PageIndex,
            PageSize = request.PageSize,
            TotalCount = adapters.Count,
            Items = mapper.Map<List<WiredNetworkAdapterDto>>(adapters
                .Skip(request.PageIndex * request.PageSize)
                .Take(request.PageSize))
        };
    }
}
