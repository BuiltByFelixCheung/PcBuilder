using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.EntityFrameworkCore;
using PcBuilderBackend.Application.Catalog.CpuCoolers;
using PcBuilderBackend.Application.Catalog.CpuCoolers.Dto;
using PcBuilderBackend.Application.Common.Dto;
using PcBuilderBackend.Application.Common.Extensions;
using PcBuilderBackend.Domain.Entities;
using PcBuilderBackend.Domain.Enums;

namespace PcBuilderBackend.Infrastructure.Persistence.Queries;

public class CpuCoolerReadStore(PcBuilderDbContext db, IMapper mapper) : ICpuCoolerReadStore
{
    public async Task<CpuCoolerDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        return await db.CpuCoolers
            .AsNoTracking()
            .Where(x => x.Id == id && x.IsActive)
            .ProjectTo<CpuCoolerDto>(mapper.ConfigurationProvider)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<PagedResult<CpuCoolerListItemDto>> ListAsync(PagedRequest request,
        CancellationToken cancellationToken)
    {
        return await db.CpuCoolers
            .AsNoTracking()
            .Include(x => x.Manufacturer)
            .ApplySorting(request.SortFields, request.SortDirection)
            .ToPagedResultAsync<CpuCooler, CpuCoolerListItemDto>(
                request.PageIndex,
                request.PageSize,
                mapper.ConfigurationProvider,
                cancellationToken);
    }

    public async Task<PagedResult<CpuCoolerListItemDto>> FilterAsync(
        PagedRequest<CpuCoolerFilter> request,
        CancellationToken cancellationToken)
    {
        var filter = request.Filter ?? new CpuCoolerFilter();
        var queryable = ApplyAttributeFilters(filter);

        queryable = await ApplyMotherboardFilterAsync(queryable, filter.MotherboardId, cancellationToken);
        if (queryable is null)
            return PagedResult<CpuCoolerListItemDto>.Empty(request);

        if (!NeedsInMemoryFilter(filter))
        {
            return await queryable
                .ApplySorting(request.SortFields, request.SortDirection)
                .ToPagedResultAsync<CpuCooler, CpuCoolerListItemDto>(
                    request.PageIndex,
                    request.PageSize,
                    mapper.ConfigurationProvider,
                    cancellationToken);
        }

        var parts = await LoadCompatibilityPartsAsync(filter, cancellationToken);
        if (parts is null)
            return PagedResult<CpuCoolerListItemDto>.Empty(request);

        IEnumerable<CpuCooler> coolers = await queryable
            .Include(x => x.Manufacturer)
            .Include(x => x.CpuCoolerSockets)
            .ToListAsync(cancellationToken);

        return PageInMemory(ApplyCompatibility(coolers, parts), request);
    }

    public async Task<List<CpuCoolerSocketDto>> ListCpuCoolerSockets(
        Guid cpuCoolerId,
        CancellationToken cancellationToken)
    {
        return await db.CpuCoolerSockets
            .AsNoTracking()
            .Where(x => x.CpuCoolerId == cpuCoolerId)
            .OrderBy(x => x.Socket.Name)
            .ProjectTo<CpuCoolerSocketDto>(mapper.ConfigurationProvider)
            .ToListAsync(cancellationToken);
    }

    private IQueryable<CpuCooler> ApplyAttributeFilters(CpuCoolerFilter filter)
    {
        return db.CpuCoolers
            .AsNoTracking()
            .WhereIf(!string.IsNullOrWhiteSpace(filter.Name), x => x.Name.Contains(filter.Name!))
            .WhereIf(filter.ManufacturerId.HasValue, x => x.ManufacturerId == filter.ManufacturerId)
            .WhereIf(filter.Type.HasValue, x => x.Type == filter.Type)
            .WhereIf(filter.CoolerHeightMm?.Min is not null,
                x => x.CoolerHeightMm >= filter.CoolerHeightMm!.Min)
            .WhereIf(filter.CoolerHeightMm?.Max is not null,
                x => x.CoolerHeightMm <= filter.CoolerHeightMm!.Max)
            .WhereIf(filter.MaxRamHeightMm?.Min is not null,
                x => x.MaxRamHeightMm >= filter.MaxRamHeightMm!.Min)
            .WhereIf(filter.MaxRamHeightMm?.Max is not null,
                x => x.MaxRamHeightMm <= filter.MaxRamHeightMm!.Max)
            .WhereIf(filter.RadiatorClass.HasValue, x => x.RadiatorClass == filter.RadiatorClass)
            .WhereIf(filter.SocketId.HasValue,
                x => x.CpuCoolerSockets.Any(s => s.SocketId == filter.SocketId && s.IsActive));
    }

    private async Task<IQueryable<CpuCooler>?> ApplyMotherboardFilterAsync(
        IQueryable<CpuCooler> queryable,
        Guid? motherboardId,
        CancellationToken cancellationToken)
    {
        if (motherboardId is not { } id)
            return queryable;

        var motherboard = await db.Motherboards
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

        if (motherboard is null)
            return null;

        return queryable.Where(x =>
            x.CpuCoolerSockets.Any(s => s.SocketId == motherboard.SocketId && s.IsActive));
    }

    private static bool NeedsInMemoryFilter(CpuCoolerFilter filter) =>
        filter.CpuId.HasValue || filter.ChassisId.HasValue || filter.RamId.HasValue;

    private async Task<CpuCoolerCompatibilityParts?> LoadCompatibilityPartsAsync(
        CpuCoolerFilter filter,
        CancellationToken cancellationToken)
    {
        var cpu = await LoadCpuAsync(filter.CpuId, cancellationToken);
        if (filter.CpuId.HasValue && cpu is null)
            return null;

        var chassis = await LoadChassisAsync(filter.ChassisId, cancellationToken);
        if (filter.ChassisId.HasValue && chassis is null)
            return null;

        var ram = await LoadRamAsync(filter.RamId, cancellationToken);
        if (filter.RamId.HasValue && ram is null)
            return null;

        return new CpuCoolerCompatibilityParts(cpu, chassis, ram);
    }

    private async Task<Cpu?> LoadCpuAsync(Guid? cpuId, CancellationToken cancellationToken)
    {
        if (cpuId is not { } id)
            return null;

        return await db.Cpus
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    private async Task<Chassis?> LoadChassisAsync(Guid? chassisId, CancellationToken cancellationToken)
    {
        if (chassisId is not { } id)
            return null;

        return await db.Chassis
            .AsNoTracking()
            .Include(x => x.Radiators)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    private async Task<Ram?> LoadRamAsync(Guid? ramId, CancellationToken cancellationToken)
    {
        if (ramId is not { } id)
            return null;

        return await db.Rams
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    private static IEnumerable<CpuCooler> ApplyCompatibility(
        IEnumerable<CpuCooler> coolers,
        CpuCoolerCompatibilityParts parts)
    {
        if (parts.Cpu is { } cpu)
        {
            coolers = coolers.Where(x =>
                x.CheckCompatibility(cpu).Status != PartsCompatibility.Incompatible);
        }

        if (parts.Chassis is { } chassis)
            coolers = coolers.Where(chassis.CheckCpuCoolerCompatibility);

        if (parts.Ram is { } ram)
        {
            coolers = coolers.Where(x =>
                x.CheckCompatibility(ram).Status != PartsCompatibility.Incompatible);
        }

        return coolers;
    }

    private PagedResult<CpuCoolerListItemDto> PageInMemory(
        IEnumerable<CpuCooler> coolers,
        PagedRequest<CpuCoolerFilter> request)
    {
        var list = coolers
            .ApplySorting(request.SortFields, request.SortDirection)
            .ToList();

        return new PagedResult<CpuCoolerListItemDto>
        {
            PageIndex = request.PageIndex,
            PageSize = request.PageSize,
            TotalCount = list.Count,
            Items = mapper.Map<List<CpuCoolerListItemDto>>(list
                .Skip(request.PageIndex * request.PageSize)
                .Take(request.PageSize))
        };
    }

    private sealed record CpuCoolerCompatibilityParts(Cpu? Cpu, Chassis? Chassis, Ram? Ram);
}
