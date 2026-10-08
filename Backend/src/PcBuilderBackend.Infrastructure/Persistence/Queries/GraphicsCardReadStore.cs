using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.EntityFrameworkCore;
using PcBuilderBackend.Application.Catalog.GraphicsCards;
using PcBuilderBackend.Application.Catalog.GraphicsCards.Dto;
using PcBuilderBackend.Application.Common.Dto;
using PcBuilderBackend.Application.Common.Extensions;
using PcBuilderBackend.Domain.Compatibility;
using PcBuilderBackend.Domain.Entities;

namespace PcBuilderBackend.Infrastructure.Persistence.Queries;

public class GraphicsCardReadStore(PcBuilderDbContext db, IMapper mapper) : IGraphicsCardReadStore
{
    public async Task<GraphicsCardDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken) =>
        await db.GraphicsCards
            .AsNoTracking()
            .Include(x => x.Gpu.Series)
            .Where(x => x.Id == id && x.IsActive)
            .ProjectTo<GraphicsCardDto>(mapper.ConfigurationProvider)
            .FirstOrDefaultAsync(cancellationToken);

    public async Task<PagedResult<GraphicsCardListItemDto>> ListAsync(PagedRequest request,
        CancellationToken cancellationToken) =>
        await db.GraphicsCards
            .AsNoTracking()
            .Include(x => x.Gpu.Series)
            .ApplySorting(request.SortFields, request.SortDirection)
            .ToPagedResultAsync<GraphicsCard, GraphicsCardListItemDto>(
                request.PageIndex,
                request.PageSize,
                mapper.ConfigurationProvider,
                cancellationToken);

    public async Task<PagedResult<GraphicsCardListItemDto>> FilterAsync(PagedRequest<GraphicsCardFilter> request,
        CancellationToken cancellationToken)
    {
        var filter = request.Filter ?? new GraphicsCardFilter();

        var queryable = db.GraphicsCards.AsNoTracking()
            .Include(x => x.Manufacturer)
            .Include(x => x.Gpu.Series)
            .WhereIfHasText(filter.Name, name => x => x.Name.Contains(name))
            .WhereIf(filter.ManufacturerId.HasValue, x => x.ManufacturerId == filter.ManufacturerId)
            .WhereIf(filter.GpuId.HasValue, x => x.GpuId == filter.GpuId)
            .WhereIf(filter.VideoMemoryGb.HasValue, x => x.VideoMemoryGb == filter.VideoMemoryGb)
            .WhereIf(filter.PcieGeneration.HasValue, x => x.PcieGeneration == filter.PcieGeneration)
            .WhereIf(filter.PcieSlotsUsed.HasValue, x => x.PcieSlotsUsed == filter.PcieSlotsUsed)
            .WhereIf(filter.IsLowProfile.HasValue, x => x.IsLowProfile == filter.IsLowProfile)
            .WhereIf(filter.LengthMm, range => x => x.LengthMm >= range.Min && x.LengthMm <= range.Max)
            .WhereIf(filter.WidthMm, range => x => x.WidthMm >= range.Min && x.WidthMm <= range.Max)
            .WhereIf(filter.HeightMm, range => x => x.HeightMm >= range.Min && x.HeightMm <= range.Max)
            .WhereIf(filter.PowerConsumptionWatts, range =>
                x => x.PowerConsumptionWatts >= range.Min && x.PowerConsumptionWatts <= range.Max);

        if (!filter.ChassisId.HasValue && !filter.MotherboardId.HasValue)
        {
            return await queryable
                .ApplySorting(request.SortFields, request.SortDirection)
                .ToPagedResultAsync<GraphicsCard, GraphicsCardListItemDto>(
                    request.PageIndex,
                    request.PageSize,
                    mapper.ConfigurationProvider,
                    cancellationToken);
        }

        Chassis? chassis = null;
        if (filter.ChassisId is { } chassisId)
        {
            chassis = await db.Chassis
                .AsNoTracking()
                .Include(c => c.PcieSlots)
                .FirstOrDefaultAsync(c => c.Id == chassisId, cancellationToken);

            if (chassis is null)
                return PagedResult<GraphicsCardListItemDto>.Empty(request);
        }

        Motherboard? motherboard = null;
        if (filter.MotherboardId is { } motherboardId)
        {
            motherboard = await db.Motherboards
                .AsNoTracking()
                .Include(m => m.PcieSlots)
                .FirstOrDefaultAsync(m => m.Id == motherboardId, cancellationToken);

            if (motherboard is null)
                return PagedResult<GraphicsCardListItemDto>.Empty(request);
        }

        if (chassis is not null)
            queryable = queryable.Where(ChassisGraphicsCardCompatibility.Filter(chassis));

        if (motherboard is not null && !MotherboardGraphicsCompatibility.HasX16(motherboard.PcieSlots))
            queryable = queryable.Where(card => false);

        return await queryable
            .ApplySorting(request.SortFields, request.SortDirection)
            .ToPagedResultAsync<GraphicsCard, GraphicsCardListItemDto>(
                request.PageIndex,
                request.PageSize,
                mapper.ConfigurationProvider,
                cancellationToken);
    }
}