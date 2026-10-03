using AutoMapper;
using MediatR;
using Microsoft.Extensions.Logging;
using PcBuilderBackend.Application.Catalog.Chassis.Dto;
using PcBuilderBackend.Application.Common.Interfaces;
using PcBuilderBackend.Application.Common.Logging;
using PcBuilderBackend.Application.Common.Validation;
using PcBuilderBackend.Domain.ValueObjects;

namespace PcBuilderBackend.Application.Catalog.Chassis.Commands.ImportChassis;

public class ImportChassisHandler(
    IChassisRepository chassis,
    IUnitOfWork unitOfWork,
    IActiveEntityLookup lookup,
    IExcelImportService excel,
    IMapper mapper,
    ILogger<ImportChassisHandler> logger)
    : IRequestHandler<ImportChassisCommand, List<ChassisDto>>
{
    public async Task<List<ChassisDto>> Handle(ImportChassisCommand request, CancellationToken cancellationToken)
    {
        var rows = await excel.ParseChassisImportAsync(request.Stream, cancellationToken);

        await ActiveEntityGuard.EnsureManufacturersExist(
            lookup, rows.Select(r => r.ManufacturerId), cancellationToken);

        var result = new List<Domain.Entities.Chassis>();

        foreach (var row in rows)
        {
            var entity = CreateChassis(row);
            chassis.Add(entity);
            result.Add(entity);
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);

        EntityLog.Imported(logger, result.Count, EntityLog.Chassis);

        return [.. result.Select(mapper.Map<ChassisDto>)];
    }

    private static Domain.Entities.Chassis CreateChassis(ChassisImportRow row)
    {
        var entity = new Domain.Entities.Chassis(
            row.Name,
            row.ManufacturerId,
            new ChassisSpecs
            {
                LengthMm = row.LengthMm,
                WidthMm = row.WidthMm,
                HeightMm = row.HeightMm,
                MotherboardMaxWidthMm = row.MotherboardMaxWidthMm,
                MotherboardMaxHeightMm = row.MotherboardMaxHeightMm,
                MaxCpuCoolerHeightMm = row.MaxCpuCoolerHeightMm,
                MaxGraphicsCardLengthMm = row.MaxGraphicsCardLengthMm,
                MaxPsuLengthMm = row.MaxPsuLengthMm
            });

        ChassisChildCollections.Apply(
            entity,
            row.DriveBays.Select(bay => new ChassisDriveBayDto(bay.FormFactors, bay.SlotCount)),
            row.FanMounts.Select(mount => new ChassisFanMountDto(
                mount.Location,
                mount.SingleDiameterOnly,
                [.. mount.Options.Select(option => new ChassisFanMountOptionDto(option.Diameter, option.SlotCount))])),
            row.PcieSlots.Select(slot => new ChassisPcieSlotDto(
                slot.LowProfileSlots,
                slot.SlotCount,
                slot.Orientation)),
            row.Radiators.Select(radiator => new ChassisRadiatorDto
            {
                Length = radiator.Length,
                Location = radiator.Location,
                RadiatorCount = radiator.RadiatorCount
            }),
            row.MbFormFactors.Select(formFactor => formFactor.MbFormFactor),
            row.PsuFormFactors.Select(formFactor => formFactor.PsuFormFactor));

        return entity;
    }
}
