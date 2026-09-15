using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.EntityFrameworkCore;
using PcBuilderBackend.Application.Catalog.Chassis;
using PcBuilderBackend.Application.Catalog.Chassis.Dto;
using PcBuilderBackend.Application.Common.Dto;
using PcBuilderBackend.Application.Common.Extensions;
using PcBuilderBackend.Domain.Enums;

namespace PcBuilderBackend.Infrastructure.Persistence.Queries;

public class ChassisReadStore(PcBuilderDbContext db, IMapper mapper) : IChassisReadStore
{
    public async Task <ChassisDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        return await db.Chassis
            .AsNoTracking()
            .Where(x => x.Id == id && x.IsActive)
            .ProjectTo<ChassisDto>(mapper.ConfigurationProvider)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<PagedResult<ChassisListItemDto>> ListAsync(
        PagedRequest request,
        CancellationToken cancellationToken)
    {
        return await db.Chassis
            .AsNoTracking()
            .ApplySorting(request.SortFields, request.SortDirection)
            .ToPagedResultAsync<Domain.Entities.Chassis, ChassisListItemDto>(
                request.PageIndex,
                request.PageSize,
                mapper.ConfigurationProvider,
                cancellationToken);
    }

    public async Task<PagedResult<ChassisListItemDto>> FilterAsync(
        PagedRequest<ChassisFilter> request,
        CancellationToken cancellationToken)
    {
        var filter = request.Filter ?? new ChassisFilter();

        return await db.Chassis
            .AsNoTracking()
            .Include(x => x.MbFormFactors)
            .WhereIfHasText(filter.Name, name => x => x.Name.Contains(name))
            .WhereIf(filter.ManufacturerId.HasValue,
                x => x.ManufacturerId == filter.ManufacturerId)
            .WhereIf(filter.SupportedMbFormFactors.Count != 0,
                x => x.MbFormFactors.Any(f => filter.SupportedMbFormFactors.Contains(f.MbFormFactor)))
            .WhereIf(filter.HeightMm, range => x =>
                x.HeightMm <= range.Max && x.HeightMm >= range.Min)
            .WhereIf(filter.LengthMm, range => x =>
                x.LengthMm <= range.Max && x.LengthMm >= range.Min)
            .WhereIf(filter.WidthMm, range => x =>
                x.WidthMm <= range.Max && x.WidthMm >= range.Min)
            .WhereIf(filter.MotherboardMaxWidthMm, range => x =>
                x.MotherboardMaxWidthMm <= range.Max && x.MotherboardMaxWidthMm >= range.Min)
            .WhereIf(filter.MotherboardMaxHeightMm, range => x =>
                x.MotherboardMaxHeightMm <= range.Max && x.MotherboardMaxHeightMm >= range.Min)
            .WhereIf(filter.MaxCpuCoolerHeightMm, range => x =>
                x.MaxCpuCoolerHeightMm <= range.Max && x.MaxCpuCoolerHeightMm >= range.Min)
            .WhereIf(filter.MaxGraphicsCardLengthMm, range => x =>
                x.MaxGraphicsCardLengthMm <= range.Max && x.MaxGraphicsCardLengthMm >= range.Min)
            .WhereIf(filter.MaxPsuLengthMm, range => x =>
                x.MaxPsuLengthMm <= range.Max && x.MaxPsuLengthMm >= range.Min)
            .ApplySorting(request.SortFields, request.SortDirection)
            .ToPagedResultAsync<Domain.Entities.Chassis, ChassisListItemDto>(
                request.PageIndex,
                request.PageSize,
                mapper.ConfigurationProvider,
                cancellationToken);
    }

    public async Task<List<ChassisDriveBayDto>> ListDriveBaysAsync(Guid chassisId, CancellationToken cancellationToken)
    {
        var chassis = await db.Chassis
            .AsNoTracking()
            .Include(x => x.DriveBays)
            .FirstOrDefaultAsync(x => x.Id == chassisId && x.IsActive, cancellationToken);

        if (chassis is null)
            return [];

        return mapper.Map<List<ChassisDriveBayDto>>(
            chassis.DriveBays.Where(x => x.IsActive).OrderBy(x => x.DriveBayFormFactor).ToList());
    }

    public async Task<List<ChassisFanMountDto>> ListFanMountsAsync(Guid chassisId, CancellationToken cancellationToken)
    {
        var chassis = await db.Chassis
            .AsNoTracking()
            .Include(x => x.FanMounts)
            .ThenInclude(x => x.Options)
            .FirstOrDefaultAsync(x => x.Id == chassisId && x.IsActive, cancellationToken);

        if (chassis is null)
            return [];

        return mapper.Map<List<ChassisFanMountDto>>(
            chassis.FanMounts.Where(x => x.IsActive).OrderBy(x => x.Location).ToList());
    }

    public async Task<List<MbFormFactor>> ListMbFormFactorsAsync(
        Guid chassisId,
        CancellationToken cancellationToken)
    {
        var chassis = await db.Chassis
            .AsNoTracking()
            .Include(x => x.MbFormFactors)
            .FirstOrDefaultAsync(x => x.Id == chassisId && x.IsActive, cancellationToken);

        if (chassis is null)
            return [];

        return
        [
            .. chassis.MbFormFactors
                .Where(x => x.IsActive)
                .Select(x => x.MbFormFactor)
                .OrderBy(x => x)
        ];
    }

    public async Task<List<ChassisPcieSlotDto>> ListPcieSlotsAsync(Guid chassisId, CancellationToken cancellationToken)
    {
        var chassis = await db.Chassis
            .AsNoTracking()
            .Include(x => x.PcieSlots)
            .FirstOrDefaultAsync(x => x.Id == chassisId && x.IsActive, cancellationToken);

        if (chassis is null)
            return [];

        return mapper.Map<List<ChassisPcieSlotDto>>(
            chassis.PcieSlots
                .Where(x => x.IsActive)
                .OrderBy(x => x.Orientation)
                .ThenBy(x => x.LowProfileSlots)
                .ToList());
    }

    public async Task<List<PsuFormFactor>> ListPsuFormFactorsAsync(Guid chassisId, CancellationToken cancellationToken)
    {
        var chassis = await db.Chassis
            .AsNoTracking()
            .Include(x => x.PsuFormFactors)
            .FirstOrDefaultAsync(x => x.Id == chassisId && x.IsActive, cancellationToken);

        if (chassis is null)
            return [];

        return
        [
            .. chassis.PsuFormFactors
                .Where(x => x.IsActive)
                .Select(x => x.PsuFormFactor)
                .OrderBy(x => x)
        ];
    }

    public async Task<List<ChassisRadiatorDto>> ListRadiatorsAsync(Guid chassisId, CancellationToken cancellationToken)
    {
        var chassis = await db.Chassis
            .AsNoTracking()
            .Include(x => x.Radiators)
            .FirstOrDefaultAsync(x => x.Id == chassisId && x.IsActive, cancellationToken);

        if (chassis is null)
            return [];

        return mapper.Map<List<ChassisRadiatorDto>>(
            chassis.Radiators
                .Where(x => x.IsActive)
                .OrderBy(x => x.MountLocation)
                .ThenBy(x => x.Length)
                .ToList());
    }
}