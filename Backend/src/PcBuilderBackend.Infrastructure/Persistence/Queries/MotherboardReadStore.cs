using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.EntityFrameworkCore;
using PcBuilderBackend.Application.Catalog.Motherboards;
using PcBuilderBackend.Application.Catalog.Motherboards.Dto;
using PcBuilderBackend.Application.Common.Dto;
using PcBuilderBackend.Application.Common.Extensions;
using PcBuilderBackend.Domain.Entities;

namespace PcBuilderBackend.Infrastructure.Persistence.Queries;

public class MotherboardReadStore(PcBuilderDbContext context, IMapper mapper) : IMotherboardReadStore
{
    public async Task<MotherboardDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        return await context.Motherboards
            .AsNoTracking()
            .Where(m => m.Id == id && m.IsActive)
            .ProjectTo<MotherboardDto>(mapper.ConfigurationProvider)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public Task<PagedResult<MotherboardListItemDto>> ListAsync(
        PagedRequest request,
        CancellationToken cancellationToken)
    {
        return context.Motherboards
            .AsNoTracking()
            .Include(x => x.Manufacturer)
            .Include(x => x.Socket)
            .Include(x => x.Chipset)
            .ApplySorting(request.SortFields, request.SortDirection)
            .ToPagedResultAsync<Motherboard, MotherboardListItemDto>(
                request.PageIndex,
                request.PageSize,
                mapper.ConfigurationProvider,
                cancellationToken);
    }

    public async Task<PagedResult<MotherboardListItemDto>> FilterAsync(
        PagedRequest<MotherboardFilter> request,
        CancellationToken cancellationToken)
    {
        var filter = request.Filter ?? new MotherboardFilter();

        var queryable = context.Motherboards
            .AsNoTracking()
            .WhereIfHasText(filter.Name, name => x => x.Name.Contains(name))
            .WhereIf(filter.ManufacturerId.HasValue,
                x => x.ManufacturerId == filter.ManufacturerId)
            .WhereIf(filter.SocketId.HasValue,
                x => x.SocketId == filter.SocketId)
            .WhereIf(filter.ChipsetId.HasValue,
                x => x.ChipsetId == filter.ChipsetId)
            .WhereIf(filter.RamSlots.HasValue,
                x => x.RamSlots == filter.RamSlots)
            .WhereIf(filter.MaxMemoryGb.HasValue,
                x => x.MaxMemoryGb == filter.MaxMemoryGb)
            .WhereIf(filter.MaxDimmSizeGb.HasValue,
                x => x.MaxDimmSizeGb == filter.MaxDimmSizeGb)
            .WhereIf(filter.SataPorts.HasValue,
                x => x.SataPorts == filter.SataPorts)
            .WhereIf(filter.FanConnectors.HasValue,
                x => x.FanConnectors == filter.FanConnectors)
            .WhereIf(filter.EpsConnectors.HasValue,
                x => x.EpsConnectors == filter.EpsConnectors)
            .WhereIf(filter.WidthMm?.Min is not null,
                x => x.WidthMm >= filter.WidthMm!.Min)
            .WhereIf(filter.WidthMm?.Max is not null,
                x => x.WidthMm <= filter.WidthMm!.Max)
            .WhereIf(filter.HeightMm?.Min is not null,
                x => x.HeightMm >= filter.HeightMm!.Min)
            .WhereIf(filter.HeightMm?.Max is not null,
                x => x.HeightMm <= filter.HeightMm!.Max)
            .WhereIf(filter.DdrGeneration.HasValue,
                x => x.DdrGeneration == filter.DdrGeneration)
            .WhereIf(filter.RamFormFactor.HasValue,
                x => x.RamFormFactor == filter.RamFormFactor)
            .WhereIf(filter.FormFactor.HasValue,
                x => x.FormFactor == filter.FormFactor)
            .WhereIf(filter.WifiEnabled.HasValue,
                x => x.WifiEnabled == filter.WifiEnabled)
            .WhereIf(filter.BluetoothEnabled.HasValue,
                x => x.BluetoothEnabled == filter.BluetoothEnabled);

        if (filter.ChassisId is not { } chassisId)
        {
            return await queryable
                .ApplySorting(request.SortFields, request.SortDirection)
                .ToPagedResultAsync<Motherboard, MotherboardListItemDto>(
                    request.PageIndex,
                    request.PageSize,
                    mapper.ConfigurationProvider,
                    cancellationToken);
        }

        var chassis = await context.Chassis
            .AsNoTracking()
            .Include(x => x.MbFormFactors)
            .FirstOrDefaultAsync(x => x.Id == chassisId, cancellationToken);

        if (chassis is null)
            return PagedResult<MotherboardListItemDto>.Empty(request);

        // Domain CheckMotherboardCompatibility is not EF-translatable; filter in memory then page.
        var list = (await queryable
                .Include(x => x.Manufacturer)
                .Include(x => x.Socket)
                .Include(x => x.Chipset)
                .ToListAsync(cancellationToken))
            .Where(chassis.CheckMotherboardCompatibility)
                .ApplySorting(request.SortFields, request.SortDirection)
                .ToList();

        return new PagedResult<MotherboardListItemDto>
        {
            PageIndex = request.PageIndex,
            PageSize = request.PageSize,
            TotalCount = list.Count,
            Items = mapper.Map<List<MotherboardListItemDto>>(list
                .Skip(request.PageIndex * request.PageSize)
                .Take(request.PageSize))
        };
    }

    public async Task<List<MotherboardM2Dto>> ListM2SlotsAsync(Guid motherboardId, CancellationToken cancellationToken)
    {
        var motherboard = await context.Motherboards
            .AsNoTracking()
            .Include(m => m.M2Slots)
            .ThenInclude(s => s.FormFactors)
            .FirstOrDefaultAsync(m => m.Id == motherboardId && m.IsActive, cancellationToken);

        if (motherboard is null)
            return [];

        var slots = motherboard.M2Slots
            .Where(s => s.IsActive)
            .OrderBy(s => s.Key)
            .ThenBy(s => s.PcieGeneration)
            .ToList();

        return mapper.Map<List<MotherboardM2Dto>>(slots);
    }

    public async Task<List<MotherboardPcieDto>> ListPcieSlotsAsync(Guid motherboardId, CancellationToken cancellationToken)
    {
        var motherboard = await context.Motherboards
            .AsNoTracking()
            .Include(m => m.PcieSlots)
            .FirstOrDefaultAsync(m => m.Id == motherboardId && m.IsActive, cancellationToken);

        if (motherboard is null)
            return [];

        var slots = motherboard.PcieSlots
            .Where(s => s.IsActive)
            .OrderBy(s => s.SlotType)
            .ThenBy(s => s.SlotLanes)
            .ThenBy(s => s.Generation)
            .ToList();

        return mapper.Map<List<MotherboardPcieDto>>(slots);
    }

    public async Task<List<MotherboardUsbDto>> ListUsbPortsAsync(Guid motherboardId, CancellationToken cancellationToken)
    {
        var motherboard = await context.Motherboards
            .AsNoTracking()
            .Include(m => m.UsbPorts)
            .FirstOrDefaultAsync(m => m.Id == motherboardId && m.IsActive, cancellationToken);

        if (motherboard is null)
            return [];

        var ports = motherboard.UsbPorts
            .Where(p => p.IsActive)
            .OrderBy(p => p.UsbType)
            .ThenBy(p => p.UsbVersion)
            .ToList();

        return mapper.Map<List<MotherboardUsbDto>>(ports);
    }
}