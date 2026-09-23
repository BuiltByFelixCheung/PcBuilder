using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.EntityFrameworkCore;
using PcBuilderBackend.Application.Catalog.Cpus;
using PcBuilderBackend.Application.Catalog.Cpus.Dto;
using PcBuilderBackend.Application.Common.Dto;
using PcBuilderBackend.Application.Common.Extensions;
using PcBuilderBackend.Domain.Entities;
using PcBuilderBackend.Domain.Enums;

namespace PcBuilderBackend.Infrastructure.Persistence.Queries;

public sealed class CpuReadStore(PcBuilderDbContext db, IMapper mapper) : ICpuReadStore
{
    public async Task<CpuDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        return await db.Cpus
            .AsNoTracking()
            .Where(c => c.Id == id)
            .ProjectTo<CpuDto>(mapper.ConfigurationProvider)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public Task<PagedResult<CpuListItemDto>> ListAsync(
        PagedRequest request,
        CancellationToken cancellationToken)
    {
        return db.Cpus
            .AsNoTracking()
            .Include(x => x.Manufacturer)
            .Include(x => x.Socket)
            .Include(x => x.Series)
            .ApplySorting(request.SortFields, request.SortDirection)
            .ToPagedResultAsync<Cpu, CpuListItemDto>(
                request.PageIndex,
                request.PageSize,
                mapper.ConfigurationProvider,
                cancellationToken);
    }

    public async Task<PagedResult<CpuListItemDto>> FilterAsync(
        PagedRequest<CpuFilter> request,
        CancellationToken cancellationToken)
    {
        var filter = request.Filter ?? new CpuFilter();

        var cpuQuery = db.Cpus
            .AsNoTracking()
            .WhereIfHasText(filter.Name, name => x => x.Name.Contains(name))
            .WhereIf(filter.ManufacturerId.HasValue,
                x => x.ManufacturerId == filter.ManufacturerId)
            .WhereIf(filter.SocketId.HasValue,
                x => x.SocketId == filter.SocketId)
            .WhereIf(filter.SeriesId.HasValue,
                x => x.SeriesId == filter.SeriesId)
            .WhereIf(filter.PowerConsumptionWatts, range =>
                x => x.PowerConsumptionWatts >= range.Min && x.PowerConsumptionWatts <= range.Max)
            .WhereIf(filter.ThermalDesignPower, range =>
                x => x.ThermalDesignPower >= range.Min && x.ThermalDesignPower <= range.Max);

        if (filter.MotherboardId is not { } motherboardId)
        {
            return await cpuQuery
                .ApplySorting(request.SortFields, request.SortDirection)
                .ToPagedResultAsync<Cpu, CpuListItemDto>(
                    request.PageIndex,
                    request.PageSize,
                    mapper.ConfigurationProvider,
                    cancellationToken);
        }

        var motherboard = await db.Motherboards
            .AsNoTracking()
            .FirstOrDefaultAsync(m => m.Id == motherboardId, cancellationToken);

        if (motherboard is null)
        {
            return new PagedResult<CpuListItemDto>
            {
                PageIndex = request.PageIndex,
                PageSize = request.PageSize,
                TotalCount = 0,
                Items = []
            };
        }

        var cpus = await cpuQuery
            .Include(x => x.Manufacturer)
            .Include(x => x.Socket)
            .Include(x => x.Series)
            .Include(x => x.SupportedChipsets)
            .ToListAsync(cancellationToken);

        var compatible = cpus
            .Where(x => motherboard.CheckCpuCompatibility(x).Status != PartsCompatibility.Incompatible)
            .ToList();

        return new PagedResult<CpuListItemDto>
        {
            PageIndex = request.PageIndex,
            PageSize = request.PageSize,
            TotalCount = compatible.Count,
            Items = mapper.Map<List<CpuListItemDto>>(compatible
                .ApplySorting(request.SortFields, request.SortDirection)
                .Skip(request.PageIndex * request.PageSize)
                .Take(request.PageSize))
        };
    }

    public Task<List<CpuRamCompatDto>> ListRamCompatsAsync(Guid cpuId, CancellationToken cancellationToken)
    {
        return db.CpuRamCompats
            .AsNoTracking()
            .Where(x => x.CpuId == cpuId)
            .OrderBy(x => x.DdrGeneration)
            .ThenBy(x => x.RamModuleCount)
            .ThenBy(x => x.RamRank)
            .ProjectTo<CpuRamCompatDto>(mapper.ConfigurationProvider)
            .ToListAsync(cancellationToken);
    }

    public Task<List<CpuSupportChipsetDto>> ListSupportChipsetsAsync(
        Guid cpuId,
        CancellationToken cancellationToken)
    {
        return db.CpuSupportChipsets
            .AsNoTracking()
            .Where(x => x.CpuId == cpuId)
            .ProjectTo<CpuSupportChipsetDto>(mapper.ConfigurationProvider)
            .ToListAsync(cancellationToken);
    }
}
