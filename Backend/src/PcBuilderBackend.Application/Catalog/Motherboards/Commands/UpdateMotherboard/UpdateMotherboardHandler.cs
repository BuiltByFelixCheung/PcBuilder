using AutoMapper;
using MediatR;
using PcBuilderBackend.Application.Catalog.Motherboards.Dto;
using PcBuilderBackend.Application.Common.Interfaces;
using PcBuilderBackend.Domain.ValueObjects;

namespace PcBuilderBackend.Application.Catalog.Motherboards.Commands.UpdateMotherboard;

public class UpdateMotherboardHandler(IMotherboardRepository motherboards, IUnitOfWork unitOfWork, IMapper mapper)
    : IRequestHandler<UpdateMotherboardCommand, MotherboardDto?>
{
    public async Task<MotherboardDto?> Handle(UpdateMotherboardCommand request, CancellationToken cancellationToken)
    {
        var entity = await motherboards.GetByIdAsync(request.Id, cancellationToken);
        if (entity is not { IsActive: true }) return null;

        entity.Rename(request.Name);
        entity.UpdateManufacturer(request.ManufacturerId);
        entity.UpdateSpecs(new MotherboardSpecs
        {
            SocketId = request.SocketId,
            ChipsetId = request.ChipsetId,
            RamSlots = request.RamSlots,
            MaxMemoryGb = request.MaxMemoryGb,
            MaxDimmSizeGb = request.MaxDimmSizeGb,
            SataPorts = request.SataPorts,
            PwmFanHeaders = request.PwmFanHeaders,
            DcFanHeaders = request.DcFanHeaders,
            EpsConnectors = request.EpsConnectors,
            WidthMm = request.WidthMm,
            HeightMm = request.HeightMm,
            DdrGeneration = request.DdrGeneration,
            RamFormFactor = request.RamFormFactor,
            MbFormFactor = request.FormFactor,
            WifiEnabled = request.WifiEnabled,
            BluetoothEnabled = request.BluetoothEnabled
        });

        await unitOfWork.SaveChangesAsync(cancellationToken);

        return mapper.Map<MotherboardDto>(entity);
    }
}
