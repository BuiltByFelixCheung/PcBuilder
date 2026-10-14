using AutoMapper;
using MediatR;
using PcBuilderBackend.Application.Catalog.Motherboards.Dto;
using PcBuilderBackend.Application.Common.Interfaces;
using PcBuilderBackend.Domain.Entities;
using PcBuilderBackend.Domain.ValueObjects;

namespace PcBuilderBackend.Application.Catalog.Motherboards.Commands.BulkCreateMotherboards;

public class BulkCreateMotherboardsHandler(IMotherboardRepository motherboards, IUnitOfWork unitOfWork, IMapper mapper)
    : IRequestHandler<BulkCreateMotherboardCommand, List<MotherboardDto>>
{
    public async Task<List<MotherboardDto>> Handle(BulkCreateMotherboardCommand request,
        CancellationToken cancellationToken)
    {
        var result = new List<MotherboardDto>();

        foreach (var motherboardDto in request.Motherboards)
        {
            var motherboard = new Motherboard(
                motherboardDto.ManufacturerId,
                motherboardDto.Name,
                new MotherboardSpecs
                {
                    SocketId = motherboardDto.SocketId,
                    ChipsetId = motherboardDto.ChipsetId,
                    RamSlots = motherboardDto.RamSlots,
                    MaxMemoryGb = motherboardDto.MaxMemoryGb,
                    MaxDimmSizeGb = motherboardDto.MaxDimmSizeGb,
                    SataPorts = motherboardDto.SataPorts,
                    PwmFanHeaders = motherboardDto.PwmFanHeaders,
                    DcFanHeaders = 0,
                    EpsConnectors = motherboardDto.EpsConnectors,
                    WidthMm = motherboardDto.WidthMm,
                    HeightMm = motherboardDto.HeightMm,
                    DdrGeneration = motherboardDto.DdrGeneration,
                    RamFormFactor = motherboardDto.RamFormFactor,
                    MbFormFactor = motherboardDto.FormFactor,
                    WifiEnabled = motherboardDto.WifiEnabled,
                    BluetoothEnabled = motherboardDto.BluetoothEnabled
                });

            foreach (var slot in motherboardDto.PcieSlots)
            {
                motherboard.AddPcieSlot(
                    new MotherboardPcie(
                        motherboard.Id,
                        slot.SlotType,
                        slot.SlotLanes,
                        slot.Generation,
                        slot.SlotCount
                    )
                );
            }

            foreach (var slot in motherboardDto.M2Slots)
            {
                var m2 = new MotherboardM2(
                    motherboard.Id,
                    slot.Key,
                    slot.PcieGeneration,
                    slot.SlotCount,
                    slot.SupportsSata
                );

                foreach (var formFactor in slot.FormFactors)
                {
                    m2.AddFormFactor(new MotherboardM2FormFactor(m2.Id, formFactor));
                }

                motherboard.AddM2Slot(m2);
            }

            foreach (var port in motherboardDto.UsbPorts)
            {
                motherboard.AddUsbPort(new MotherboardUsb(
                    motherboard.Id,
                    port.UsbVersion,
                    port.UsbType,
                    port.PortCount));
            }

            motherboards.Add(motherboard);

            result.Add(mapper.Map<MotherboardDto>(motherboard));
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);
        return result;
    }
}