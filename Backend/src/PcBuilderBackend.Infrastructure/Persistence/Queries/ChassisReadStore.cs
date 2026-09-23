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
        IQueryable<Domain.Entities.Chassis> query = db.Chassis
            .AsNoTracking()
            .WhereIfHasText(filter.Name, name => x => x.Name.Contains(name))
            .WhereIf(filter.ManufacturerId.HasValue,
                x => x.ManufacturerId == filter.ManufacturerId)
            .WhereIf(CompleteRange(filter.HeightMm), range => x =>
                x.HeightMm >= range.Min && x.HeightMm <= range.Max)
            .WhereIf(CompleteRange(filter.LengthMm), range => x =>
                x.LengthMm >= range.Min && x.LengthMm <= range.Max)
            .WhereIf(CompleteRange(filter.WidthMm), range => x =>
                x.WidthMm >= range.Min && x.WidthMm <= range.Max)
            .WhereIf(CompleteRange(filter.MotherboardMaxWidthMm), range => x =>
                x.MotherboardMaxWidthMm >= range.Min && x.MotherboardMaxWidthMm <= range.Max)
            .WhereIf(CompleteRange(filter.MotherboardMaxHeightMm), range => x =>
                x.MotherboardMaxHeightMm >= range.Min && x.MotherboardMaxHeightMm <= range.Max)
            .WhereIf(CompleteRange(filter.MaxCpuCoolerHeightMm), range => x =>
                x.MaxCpuCoolerHeightMm >= range.Min && x.MaxCpuCoolerHeightMm <= range.Max)
            .WhereIf(CompleteRange(filter.MaxGraphicsCardLengthMm), range => x =>
                x.MaxGraphicsCardLengthMm >= range.Min && x.MaxGraphicsCardLengthMm <= range.Max)
            .WhereIf(CompleteRange(filter.MaxPsuLengthMm), range => x =>
                x.MaxPsuLengthMm >= range.Min && x.MaxPsuLengthMm <= range.Max);

        query = WhereLargestSupportedMbFormFactor(query, filter.MaxSupportedMbFormFactor);

        return await query
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

    private static RangeFilter? CompleteRange(RangeFilter? range) =>
        range is { Min: not null, Max: not null } ? range : null;

    private static IQueryable<Domain.Entities.Chassis> WhereLargestSupportedMbFormFactor(
        IQueryable<Domain.Entities.Chassis> query,
        MbFormFactor? maxMb) =>
        maxMb switch
        {
            MbFormFactor.Mitx => query.Where(x =>
                x.MbFormFactors.Any(f => f.MbFormFactor == MbFormFactor.Mitx)
                && !x.MbFormFactors.Any(f =>
                    f.MbFormFactor == MbFormFactor.Matx
                    || f.MbFormFactor == MbFormFactor.Atx
                    || f.MbFormFactor == MbFormFactor.Eatx)),
            MbFormFactor.Matx => query.Where(x =>
                x.MbFormFactors.Any(f => f.MbFormFactor == MbFormFactor.Matx)
                && !x.MbFormFactors.Any(f =>
                    f.MbFormFactor == MbFormFactor.Atx
                    || f.MbFormFactor == MbFormFactor.Eatx)),
            MbFormFactor.Atx => query.Where(x =>
                x.MbFormFactors.Any(f => f.MbFormFactor == MbFormFactor.Atx)
                && x.MbFormFactors.All(f => f.MbFormFactor != MbFormFactor.Eatx)),
            MbFormFactor.Eatx => query.Where(x =>
                x.MbFormFactors.Any(f => f.MbFormFactor == MbFormFactor.Eatx)),
            _ => query
        };
}