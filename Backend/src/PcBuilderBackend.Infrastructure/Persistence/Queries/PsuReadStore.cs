using AutoMapper;
using Microsoft.EntityFrameworkCore;
using PcBuilderBackend.Application.Catalog.Psus;
using PcBuilderBackend.Application.Catalog.Psus.Dto;
using PcBuilderBackend.Application.Common.Dto;
using PcBuilderBackend.Application.Common.Extensions;
using PcBuilderBackend.Domain.Compatibility;
using PcBuilderBackend.Domain.Entities;

namespace PcBuilderBackend.Infrastructure.Persistence.Queries;

public sealed class PsuReadStore(PcBuilderDbContext db, IMapper mapper) : IPsuReadStore
{
    public async Task<PsuDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        var entity = await db.Psus
            .AsNoTracking()
            .Include(x => x.Manufacturer)
            .Include(x => x.Cables)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

        return entity is null ? null : mapper.Map<PsuDto>(entity);
    }

    public Task<PagedResult<PsuListItemDto>> ListAsync(PagedRequest request, CancellationToken cancellationToken) =>
        db.Psus
            .AsNoTracking()
            .ApplySorting(request.SortFields, request.SortDirection)
            .ToPagedResultAsync<Psu, PsuListItemDto>(
                request.PageIndex,
                request.PageSize,
                mapper.ConfigurationProvider,
                cancellationToken);

    public async Task<PagedResult<PsuListItemDto>> FilterAsync(
        PagedRequest<PsuFilter> request,
        CancellationToken cancellationToken)
    {
        var filter = request.Filter ?? new PsuFilter();
        var queryable = ApplyAttributeFilters(filter);

        if (!NeedsCompatibility(filter))
        {
            return await queryable
                .ApplySorting(request.SortFields, request.SortDirection)
                .ToPagedResultAsync<Psu, PsuListItemDto>(
                    request.PageIndex,
                    request.PageSize,
                    mapper.ConfigurationProvider,
                    cancellationToken);
        }

        var parts = await LoadCompatibilityPartsAsync(filter, cancellationToken);
        if (parts is null)
            return PagedResult<PsuListItemDto>.Empty(request);

        if (parts.Chassis is { } chassis)
            queryable = queryable.Where(ChassisPsuCompatibility.Filter(chassis));

        if (parts.Motherboard is { } motherboard)
            queryable = queryable.Where(PsuMotherboardCompatibility.Filter(motherboard));

        if (parts.GraphicsCard is { } graphicsCard)
            queryable = queryable.Where(PsuGraphicsCardCompatibility.Filter(graphicsCard));

        if (parts.Cpu is { } cpu)
            queryable = queryable.Where(PsuPowerBudgetCompatibility.Filter(cpu, parts.GraphicsCard));

        return await queryable
            .ApplySorting(request.SortFields, request.SortDirection)
            .ToPagedResultAsync<Psu, PsuListItemDto>(
                request.PageIndex,
                request.PageSize,
                mapper.ConfigurationProvider,
                cancellationToken);
    }

    public async Task<List<PsuCableDto>> ListCablesAsync(Guid psuId, CancellationToken cancellationToken)
    {
        var psu = await db.Psus
            .AsNoTracking()
            .Include(x => x.Cables)
            .FirstOrDefaultAsync(x => x.Id == psuId, cancellationToken);

        if (psu is null)
            return [];

        return mapper.Map<List<PsuCableDto>>(
            psu.Cables.Where(x => x.IsActive).OrderBy(x => x.Type).ToList());
    }

    private IQueryable<Psu> ApplyAttributeFilters(PsuFilter filter)
    {
        return db.Psus.AsNoTracking()
            .Include(x => x.Manufacturer)
            .WhereIfHasText(filter.Name, name => x => x.Name.Contains(name))
            .WhereIf(filter.ManufacturerId.HasValue, x => x.ManufacturerId == filter.ManufacturerId)
            .WhereIf(filter.Wattage, range => x => x.Wattage >= range.Min && x.Wattage <= range.Max)
            .WhereIf(filter.Modularity.HasValue, x => x.Modularity == filter.Modularity)
            .WhereIf(filter.FormFactor.HasValue, x => x.FormFactor == filter.FormFactor)
            .WhereIf(filter.LengthMm, range => x => x.LengthMm >= range.Min && x.LengthMm <= range.Max)
            .WhereIf(filter.WidthMm, range => x => x.WidthMm >= range.Min && x.WidthMm <= range.Max)
            .WhereIf(filter.HeightMm, range => x => x.HeightMm >= range.Min && x.HeightMm <= range.Max);
    }

    private static bool NeedsCompatibility(PsuFilter filter) =>
        filter.ChassisId.HasValue
        || filter.MotherboardId.HasValue
        || filter.GraphicsCardId.HasValue
        || filter.CpuId.HasValue;

    private async Task<PsuCompatibilityParts?> LoadCompatibilityPartsAsync(
        PsuFilter filter,
        CancellationToken cancellationToken)
    {
        var chassis = await LoadChassisAsync(filter.ChassisId, cancellationToken);
        if (filter.ChassisId.HasValue && chassis is null)
            return null;

        var motherboard = await LoadMotherboardAsync(filter.MotherboardId, cancellationToken);
        if (filter.MotherboardId.HasValue && motherboard is null)
            return null;

        var graphicsCard = await LoadGraphicsCardAsync(filter.GraphicsCardId, cancellationToken);
        if (filter.GraphicsCardId.HasValue && graphicsCard is null)
            return null;

        var cpu = await LoadCpuAsync(filter.CpuId, cancellationToken);
        if (filter.CpuId.HasValue && cpu is null)
            return null;

        return new PsuCompatibilityParts(chassis, motherboard, graphicsCard, cpu);
    }

    private async Task<Chassis?> LoadChassisAsync(Guid? chassisId, CancellationToken cancellationToken)
    {
        if (chassisId is not { } id)
            return null;

        return await db.Chassis
            .AsNoTracking()
            .Include(c => c.PsuFormFactors)
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
    }

    private async Task<Motherboard?> LoadMotherboardAsync(Guid? motherboardId, CancellationToken cancellationToken)
    {
        if (motherboardId is not { } id)
            return null;

        return await db.Motherboards
            .AsNoTracking()
            .FirstOrDefaultAsync(m => m.Id == id, cancellationToken);
    }

    private async Task<GraphicsCard?> LoadGraphicsCardAsync(Guid? graphicsCardId, CancellationToken cancellationToken)
    {
        if (graphicsCardId is not { } id)
            return null;

        return await db.GraphicsCards
            .AsNoTracking()
            .FirstOrDefaultAsync(g => g.Id == id, cancellationToken);
    }

    private async Task<Cpu?> LoadCpuAsync(Guid? cpuId, CancellationToken cancellationToken)
    {
        if (cpuId is not { } id)
            return null;

        return await db.Cpus
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
    }

    private sealed record PsuCompatibilityParts(
        Chassis? Chassis,
        Motherboard? Motherboard,
        GraphicsCard? GraphicsCard,
        Cpu? Cpu);
}
