using AutoMapper;
using MediatR;
using Microsoft.Extensions.Logging;
using PcBuilderBackend.Application.Catalog.Motherboards.Dto;
using PcBuilderBackend.Application.Common.Interfaces;
using PcBuilderBackend.Application.Common.Logging;
using PcBuilderBackend.Application.Common.Validation;
using PcBuilderBackend.Domain.Entities;
using PcBuilderBackend.Domain.ValueObjects;

namespace PcBuilderBackend.Application.Catalog.Motherboards.Commands.ImportMotherboards;

public class ImportMotherboardsHandler(
    IMotherboardRepository motherboards,
    IUnitOfWork unitOfWork,
    IActiveEntityLookup lookup,
    IExcelImportService excel,
    IMapper mapper,
    ILogger<ImportMotherboardsHandler> logger)
    : IRequestHandler<ImportMotherboardsCommand, List<MotherboardDto>>
{
    public async Task<List<MotherboardDto>> Handle(
        ImportMotherboardsCommand request,
        CancellationToken cancellationToken)
    {
        var rows = await excel.ParseMotherboardImportAsync(request.Stream, cancellationToken);

        await ActiveEntityGuard.EnsureManufacturersExist(lookup, rows.Select(r => r.ManufacturerId), cancellationToken);
        await ActiveEntityGuard.EnsureSocketsExist(lookup, rows.Select(r => r.SocketId), cancellationToken);
        await ActiveEntityGuard.EnsureChipsetsExist(lookup, rows.Select(r => r.ChipsetId), cancellationToken);

        var result = new List<Motherboard>();

        foreach (var row in rows)
        {
            var entity = new Motherboard(
                row.ManufacturerId,
                row.Name,
                new MotherboardSpecs
                {
                    SocketId = row.SocketId,
                    ChipsetId = row.ChipsetId,
                    RamSlots = row.RamSlots,
                    MaxMemoryGb = row.MaxMemoryGb,
                    MaxDimmSizeGb = row.MaxDimmSizeGb,
                    SataPorts = row.SataPorts,
                    PwmFanHeaders = row.PwmFanHeaders,
                    DcFanHeaders = 0,
                    EpsConnectors = row.EpsConnectors,
                    WidthMm = row.WidthMm,
                    HeightMm = row.HeightMm,
                    DdrGeneration = row.DdrGeneration,
                    RamFormFactor = row.RamFormFactor,
                    MbFormFactor = row.FormFactor,
                    WifiEnabled = row.WifiEnabled,
                    BluetoothEnabled = row.BluetoothEnabled
                });

            foreach (var slot in row.PcieSlots)
            {
                entity.AddPcieSlot(new MotherboardPcie(
                    entity.Id,
                    slot.SlotType,
                    slot.SlotLanes,
                    slot.Generation,
                    slot.SlotCount));
            }

            foreach (var slot in row.M2Slots)
            {
                var m2 = new MotherboardM2(
                    entity.Id, slot.Key, slot.PcieGeneration, slot.SlotCount, slot.SupportsSata);

                foreach (var formFactor in slot.FormFactors)
                {
                    m2.AddFormFactor(new MotherboardM2FormFactor(m2.Id, formFactor));
                }

                entity.AddM2Slot(m2);
            }

            foreach (var port in row.UsbPorts)
            {
                entity.AddUsbPort(new MotherboardUsb(
                    entity.Id, port.UsbVersion, port.UsbType, port.PortCount));
            }

            motherboards.Add(entity);
            result.Add(entity);
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);

        EntityLog.Imported(logger, result.Count, EntityLog.Motherboard);

        return [.. result.Select(mapper.Map<MotherboardDto>)];
    }
}
