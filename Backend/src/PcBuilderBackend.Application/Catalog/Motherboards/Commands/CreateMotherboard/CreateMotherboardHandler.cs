using AutoMapper;
using MediatR;
using PcBuilderBackend.Application.Catalog.Motherboards.Dto;
using PcBuilderBackend.Application.Common.Interfaces;
using PcBuilderBackend.Domain.Entities;
using PcBuilderBackend.Domain.ValueObjects;

namespace PcBuilderBackend.Application.Catalog.Motherboards.Commands.CreateMotherboard;

public class CreateMotherboardHandler(IMotherboardRepository motherboards, IUnitOfWork unitOfWork, IMapper mapper)
    : IRequestHandler<CreateMotherboardCommand, MotherboardDto>
{
    public async Task<MotherboardDto> Handle(CreateMotherboardCommand request, CancellationToken cancellationToken)
    {
        var entity = new Motherboard(
            request.ManufacturerId,
            request.Name,
            new MotherboardSpecs
            {
                SocketId = request.SocketId,
                ChipsetId = request.ChipsetId,
                RamSlots = request.RamSlots,
                MaxMemoryGb = request.MaxMemoryGb,
                MaxDimmSizeGb = request.MaxDimmSizeGb,
                SataPorts = request.SataPorts,
                PwmFanHeaders = request.PwmFanHeaders,
                DcFanHeaders = 0,
                EpsConnectors = request.EpsConnectors,
                WidthMm = request.WidthMm,
                HeightMm = request.HeightMm,
                DdrGeneration = request.DdrGeneration,
                RamFormFactor = request.RamFormFactor,
                MbFormFactor = request.FormFactor,
                WifiEnabled = request.WifiEnabled,
                BluetoothEnabled = request.BluetoothEnabled
            });

        foreach (var slot in request.PcieSlots)
        {
            entity.AddPcieSlot(new MotherboardPcie(entity.Id, slot.SlotType, slot.SlotLanes, slot.Generation, slot.SlotCount));
        }

        foreach (var slot in request.M2Slots)
        {
            var slotEntity = new MotherboardM2(
                entity.Id, slot.Key, slot.PcieGeneration, slot.SlotCount, slot.SupportsSata);

            foreach (var formFactor in slot.FormFactors)
            {
                slotEntity.AddFormFactor(new MotherboardM2FormFactor(slotEntity.Id, formFactor));
            }
            
            entity.AddM2Slot(slotEntity);
        }

        foreach (var port in request.UsbPorts)
        {
            entity.AddUsbPort(new MotherboardUsb(entity.Id, port.UsbVersion, port.UsbType, port.PortCount));
        }
        
        motherboards.Add(entity);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return mapper.Map<MotherboardDto>(entity);
    }
}
