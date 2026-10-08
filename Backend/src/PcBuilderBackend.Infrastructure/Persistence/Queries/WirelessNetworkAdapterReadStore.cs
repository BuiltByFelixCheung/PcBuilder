using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.EntityFrameworkCore;
using PcBuilderBackend.Application.Catalog.WirelessNetworkAdapters;
using PcBuilderBackend.Application.Catalog.WirelessNetworkAdapters.Dto;
using PcBuilderBackend.Application.Common.Dto;
using PcBuilderBackend.Application.Common.Extensions;
using PcBuilderBackend.Domain.Compatibility;
using PcBuilderBackend.Domain.Entities;

namespace PcBuilderBackend.Infrastructure.Persistence.Queries;

public sealed class WirelessNetworkAdapterReadStore(PcBuilderDbContext db, IMapper mapper)
    : IWirelessNetworkAdapterReadStore
{
    public Task<WirelessNetworkAdapterDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken) =>
        db.WirelessNetworkAdapters
            .AsNoTracking()
            .Where(x => x.Id == id)
            .ProjectTo<WirelessNetworkAdapterDto>(mapper.ConfigurationProvider)
            .FirstOrDefaultAsync(cancellationToken);

    public Task<PagedResult<WirelessNetworkAdapterDto>> ListAsync(
        PagedRequest request,
        CancellationToken cancellationToken) =>
        db.WirelessNetworkAdapters
            .AsNoTracking()
            .Include(x => x.Manufacturer)
            .ApplySorting(request.SortFields, request.SortDirection)
            .ToPagedResultAsync<WirelessNetworkAdapter, WirelessNetworkAdapterDto>(
                request.PageIndex,
                request.PageSize,
                mapper.ConfigurationProvider,
                cancellationToken);

    public async Task<PagedResult<WirelessNetworkAdapterDto>> FilterAsync(
        PagedRequest<WirelessNetworkAdapterFilter> request,
        CancellationToken cancellationToken)
    {
        var filter = request.Filter ?? new WirelessNetworkAdapterFilter();

        var queryable = db.WirelessNetworkAdapters.AsNoTracking()
            .Include(x => x.Manufacturer)
            .WhereIfHasText(filter.Name, name => x => x.Name.Contains(name))
            .WhereIf(filter.ManufacturerId.HasValue, x => x.ManufacturerId == filter.ManufacturerId)
            .WhereIf(filter.WifiStandard.HasValue, x => x.WifiStandard == filter.WifiStandard)
            .WhereIf(filter.BluetoothVersion.HasValue, x => x.BluetoothVersion == filter.BluetoothVersion)
            .WhereIf(filter.HostInterface.HasValue, x => x.HostInterface == filter.HostInterface)
            .WhereIf(filter.MaxSpeedMbps, range =>
                x => x.MaxSpeedMbps >= range.Min && x.MaxSpeedMbps <= range.Max)
            .WhereIf(filter.MaxSpeedMbps5G, range =>
                x => x.MaxSpeedMbps5G >= range.Min && x.MaxSpeedMbps5G <= range.Max)
            .WhereIf(filter.MaxSpeedMbps6G, range =>
                x => x.MaxSpeedMbps6G >= range.Min && x.MaxSpeedMbps6G <= range.Max)
            .WhereIf(filter.PcieSlotType.HasValue, x => x.PcieSlotType == filter.PcieSlotType)
            .WhereIf(filter.Key.HasValue, x => x.Key == filter.Key)
            .WhereIf(filter.M2FormFactor.HasValue, x => x.M2FormFactor == filter.M2FormFactor)
            .WhereIf(filter.UsbVersion.HasValue, x => x.UsbVersion == filter.UsbVersion)
            .WhereIf(filter.UsbType.HasValue, x => x.UsbType == filter.UsbType);

        if (!filter.MotherboardId.HasValue)
        {
            return await queryable
                .ApplySorting(request.SortFields, request.SortDirection)
                .ToPagedResultAsync<WirelessNetworkAdapter, WirelessNetworkAdapterDto>(
                    request.PageIndex,
                    request.PageSize,
                    mapper.ConfigurationProvider,
                    cancellationToken);
        }

        var motherboard = await db.Motherboards
            .AsNoTracking()
            .Include(m => m.PcieSlots)
            .Include(m => m.UsbPorts)
            .Include(m => m.M2Slots)
            .ThenInclude(s => s.FormFactors)
            .AsSplitQuery()
            .FirstOrDefaultAsync(m => m.Id == filter.MotherboardId.Value, cancellationToken);

        if (motherboard is null)
            return PagedResult<WirelessNetworkAdapterDto>.Empty(request);

        return await queryable
            .Where(NetworkAdapterCompatibility.WirelessFilter(
                motherboard.PcieSlots,
                motherboard.UsbPorts,
                motherboard.M2Slots))
            .ApplySorting(request.SortFields, request.SortDirection)
            .ToPagedResultAsync<WirelessNetworkAdapter, WirelessNetworkAdapterDto>(
                request.PageIndex,
                request.PageSize,
                mapper.ConfigurationProvider,
                cancellationToken);
    }
}
