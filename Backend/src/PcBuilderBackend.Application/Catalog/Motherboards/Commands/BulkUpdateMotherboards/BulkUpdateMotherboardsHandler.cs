using AutoMapper;
using MediatR;
using Microsoft.Extensions.Logging;
using PcBuilderBackend.Application.Catalog.Motherboards.Dto;
using PcBuilderBackend.Application.Common.Interfaces;
using PcBuilderBackend.Application.Common.Logging;
using PcBuilderBackend.Domain.ValueObjects;

namespace PcBuilderBackend.Application.Catalog.Motherboards.Commands.BulkUpdateMotherboards;

public class BulkUpdateMotherboardsHandler(
    IMotherboardRepository motherboards,
    IUnitOfWork unitOfWork,
    ILogger<BulkUpdateMotherboardsHandler> logger,
    IMapper mapper) : IRequestHandler<BulkUpdateMotherboardsCommand, List<MotherboardDto>?>
{
    public async Task<List<MotherboardDto>?> Handle(BulkUpdateMotherboardsCommand request,
        CancellationToken cancellationToken)
    {
        var result = new List<MotherboardDto>();

        foreach (var command in request.Motherboards)
        {
            var entity = await motherboards.GetWithChildrenAsync(command.Id, cancellationToken);

            if (entity == null)
            {
                EntityLog.NotFoundOrInactive(logger, EntityLog.Motherboard, command.Id);
                return null;
            }

            entity.Rename(command.Name);
            entity.UpdateManufacturer(command.ManufacturerId);
            entity.UpdateSpecs(new MotherboardSpecs
            {
                SocketId = command.SocketId,
                ChipsetId = command.ChipsetId,
                RamSlots = command.RamSlots,
                MaxMemoryGb = command.MaxMemoryGb,
                MaxDimmSizeGb = command.MaxDimmSizeGb,
                SataPorts = command.SataPorts,
                PwmFanHeaders = command.PwmFanHeaders,
                DcFanHeaders = command.DcFanHeaders,
                EpsConnectors = command.EpsConnectors,
                WidthMm = command.WidthMm,
                HeightMm = command.HeightMm,
                DdrGeneration = command.DdrGeneration,
                RamFormFactor = command.RamFormFactor,
                MbFormFactor = command.FormFactor,
                WifiEnabled = command.WifiEnabled,
                BluetoothEnabled = command.BluetoothEnabled
            });

            result.Add(mapper.Map<MotherboardDto>(entity));
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);

        EntityLog.BulkUpdated(logger, result.Count, EntityLog.Motherboard);

        return result;
    }
}