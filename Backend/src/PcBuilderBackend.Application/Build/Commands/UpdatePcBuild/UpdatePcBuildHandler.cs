using AutoMapper;
using MediatR;
using Microsoft.Extensions.Logging;
using PcBuilderBackend.Application.Build.Dto;
using PcBuilderBackend.Application.Common.Interfaces;
using PcBuilderBackend.Application.Common.Logging;
using PcBuilderBackend.Domain.Enums;
using PcBuilderBackend.Domain.ValueObjects;

namespace PcBuilderBackend.Application.Build.Commands.UpdatePcBuild;

public class UpdatePcBuildHandler(
    IPcBuildRepository pcBuilds,
    IUnitOfWork unitOfWork,
    ICompatibilityChecker checker,
    ILogger<UpdatePcBuildHandler> logger,
    ICurrentUser currentUser,
    IMapper mapper) : IRequestHandler<UpdatePcBuildCommand, PcBuildDto?>
{
    public async Task<PcBuildDto?> Handle(UpdatePcBuildCommand command, CancellationToken cancellationToken)
    {
        var pcBuild = await pcBuilds.GetWithChildrenAsync(command.Id);

        if (pcBuild is null)
        {
            EntityLog.NotFound(logger, EntityLog.PcBuild, command.Id);
            return null;
        }

        if (pcBuild.User is null || currentUser.UserId is not { } userId || pcBuild.User.UserId != userId)
        {
            EntityLog.NotAuthorized(logger, EntityLog.PcBuild, command.Id);
            throw new UnauthorizedAccessException();
        }

        var compatibilityResults = await checker.CheckCompatibilityAsync(
            new CompatibilityCheckRequest
            {
                ChassisId = command.ChassisId,
                MotherboardId = command.MotherboardId,
                CpuId = command.CpuId,
                CpuCoolerId = command.CpuCoolerId,
                RamKitId = command.RamKitId,
                GraphicsCardId = command.GraphicsCardId,
                PsuId = command.PsuId,
                ChassisFans = command.ChassisFans,
                StorageDevices = command.StorageDevices,
                WiredNetworkAdapters = command.WiredNetworkAdapters,
                WirelessNetworkAdapters = command.WirelessNetworkAdapters
            });

        if (compatibilityResults.Any(r => r.Result.Status == PartsCompatibility.Incompatible))
        {
            EntityLog.CompatibilityCheckFailed(logger, pcBuild.Id);
            throw new ArgumentException("Build is incompatible.");
        }

        pcBuild.Update(
            command.Name,
            command.Description,
            new PcBuildComponents
            {
                ChassisId = command.ChassisId,
                MotherboardId = command.MotherboardId,
                CpuId = command.CpuId,
                CpuCoolerId = command.CpuCoolerId,
                RamKitId = command.RamKitId,
                GraphicsCardId = command.GraphicsCardId,
                PsuId = command.PsuId
            });

        pcBuild.User.Update(pcBuild.Id, userId, command.IsPublic);

        foreach (var part in pcBuild.Parts.ToList())
        {
            switch (part.Type)
            {
                case PcBuildPartType.ChassisFan:
                    pcBuild.RemoveChassisFan(part.PartId, part.Quantity);
                    break;
                case PcBuildPartType.StorageDrive:
                    pcBuild.RemoveStorageDevice(part.PartId, part.Quantity);
                    break;
                case PcBuildPartType.WiredNetworkAdapter:
                    pcBuild.RemoveWiredNetworkAdapter(part.PartId, part.Quantity);
                    break;
                case PcBuildPartType.WirelessNetworkAdapter:
                    pcBuild.RemoveWirelessNetworkAdapter(part.PartId, part.Quantity);
                    break;
                default:
                    throw new ArgumentOutOfRangeException(nameof(command), part.Type, $"Unsupported part type '{part.Type}'.");
            }

            pcBuilds.DeletePart(part);
        }

        foreach (var chassisFan in command.ChassisFans)
            pcBuild.AddChassisFan(chassisFan.PartId, chassisFan.Quantity);

        foreach (var storageDevice in command.StorageDevices)
            pcBuild.AddStorageDevice(storageDevice.PartId, storageDevice.Quantity);

        foreach (var wiredNetworkAdapter in command.WiredNetworkAdapters)
            pcBuild.AddWiredNetworkAdapter(wiredNetworkAdapter.PartId, wiredNetworkAdapter.Quantity);

        foreach (var wirelessNetworkAdapter in command.WirelessNetworkAdapters)
            pcBuild.AddWirelessNetworkAdapter(wirelessNetworkAdapter.PartId, wirelessNetworkAdapter.Quantity);

        await unitOfWork.SaveChangesAsync(cancellationToken);
        EntityLog.Updated(logger, EntityLog.PcBuild, pcBuild.Id);
        return mapper.Map<PcBuildDto>(pcBuild);
    }
}
