using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.EntityFrameworkCore;
using PcBuilderBackend.Application.Catalog.CpuCoolers;
using PcBuilderBackend.Application.Catalog.CpuCoolers.Dto;
using PcBuilderBackend.Application.Common.Dto;
using PcBuilderBackend.Application.Common.Extensions;
using PcBuilderBackend.Domain.Compatibility;
using PcBuilderBackend.Domain.Entities;

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

        queryable = await ApplyCpuFilterAsync(queryable, filter.CpuId, cancellationToken);
        if (queryable is null)
            return PagedResult<CpuCoolerListItemDto>.Empty(request);

        queryable = await ApplyChassisFilterAsync(queryable, filter.ChassisId, cancellationToken);
        if (queryable is null)
            return PagedResult<CpuCoolerListItemDto>.Empty(request);

        queryable = await ApplyRamFilterAsync(queryable, filter.RamId, cancellationToken);
        if (queryable is null)
            return PagedResult<CpuCoolerListItemDto>.Empty(request);

        return await queryable
            .ApplySorting(request.SortFields, request.SortDirection)
            .ToPagedResultAsync<CpuCooler, CpuCoolerListItemDto>(
                request.PageIndex,
                request.PageSize,
                mapper.ConfigurationProvider,
                cancellationToken);
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

        return queryable.Where(CpuCoolerCpuCompatibility.Filter(motherboard.SocketId));
    }

    private async Task<IQueryable<CpuCooler>?> ApplyCpuFilterAsync(
        IQueryable<CpuCooler> queryable,
        Guid? cpuId,
        CancellationToken cancellationToken)
    {
        if (cpuId is not { } id)
            return queryable;

        var cpu = await db.Cpus
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

        return cpu is null ? null : queryable.Where(CpuCoolerCpuCompatibility.Filter(cpu.SocketId));
    }

    private async Task<IQueryable<CpuCooler>?> ApplyChassisFilterAsync(
        IQueryable<CpuCooler> queryable,
        Guid? chassisId,
        CancellationToken cancellationToken)
    {
        if (chassisId is not { } id)
            return queryable;

        var chassis = await db.Chassis
            .AsNoTracking()
            .Include(x => x.Radiators)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

        return chassis is null ? null : queryable.Where(ChassisCpuCoolerCompatibility.Filter(chassis));
    }

    private async Task<IQueryable<CpuCooler>?> ApplyRamFilterAsync(
        IQueryable<CpuCooler> queryable,
        Guid? ramId,
        CancellationToken cancellationToken)
    {
        if (ramId is not { } id)
            return queryable;

        var ram = await db.Rams
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

        return ram is null ? null : queryable.Where(CpuCoolerRamCompatibility.Filter(ram.HeightMm));
    }
}
