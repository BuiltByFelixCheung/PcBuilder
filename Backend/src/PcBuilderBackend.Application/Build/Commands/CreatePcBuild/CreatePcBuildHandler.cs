using AutoMapper;
using MediatR;
using Microsoft.Extensions.Logging;
using PcBuilderBackend.Application.Build.Dto;
using PcBuilderBackend.Application.Common.Authorization;
using PcBuilderBackend.Application.Common.Interfaces;
using PcBuilderBackend.Application.Common.Logging;
using PcBuilderBackend.Domain.Entities;
using PcBuilderBackend.Domain.Enums;
using PcBuilderBackend.Domain.ValueObjects;

namespace PcBuilderBackend.Application.Build.Commands.CreatePcBuild;

public class CreatePcBuildHandler(
    IPcBuildRepository pcBuilds,
    ICompatibilityChecker compatibilityChecker,
    ILogger<CreatePcBuildHandler> logger,
    ICurrentUser currentUser,
    IUnitOfWork unitOfWork,
    IMapper mapper) : IRequestHandler<CreatePcBuildCommand, PcBuildDto>
{
    public async Task<PcBuildDto> Handle(CreatePcBuildCommand command, CancellationToken cancellationToken)
    {
        if (currentUser.IsAuthenticated && !currentUser.IsInRole(AuthRoles.Member))
            throw new UnauthorizedAccessException();

        var compatibilityResults = await compatibilityChecker.CheckCompatibilityAsync(
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
            EntityLog.CompatibilityCheckFailedOnCreation(logger);
            throw new ArgumentException("Build is incompatible.");
        }

        var pcBuild = new PcBuild(
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

        foreach (var chassisFan in command.ChassisFans)
            pcBuild.AddChassisFan(chassisFan.PartId, chassisFan.Quantity);

        foreach (var storageDevice in command.StorageDevices)
            pcBuild.AddStorageDevice(storageDevice.PartId, storageDevice.Quantity);

        foreach (var wiredNetworkAdapter in command.WiredNetworkAdapters)
            pcBuild.AddWiredNetworkAdapter(wiredNetworkAdapter.PartId, wiredNetworkAdapter.Quantity);

        foreach (var wirelessNetworkAdapter in command.WirelessNetworkAdapters)
            pcBuild.AddWirelessNetworkAdapter(wirelessNetworkAdapter.PartId, wirelessNetworkAdapter.Quantity);

        pcBuilds.Add(pcBuild);

        if (currentUser.IsInRole(AuthRoles.Member) && currentUser.UserId is { } userId)
        {
            var pcBuildUser = new PcBuildUser(pcBuild.Id, userId, true);
            pcBuilds.AddUser(pcBuildUser);
            await unitOfWork.SaveChangesAsync(cancellationToken);
            EntityLog.Created(logger, EntityLog.PcBuild, pcBuild.Id);
            LogPcBuildPartsCreation(pcBuild);
            EntityLog.Created(logger, EntityLog.PcBuildUser, pcBuildUser.Id);
            return mapper.Map<PcBuildDto>(pcBuild);
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);
        EntityLog.Created(logger, EntityLog.PcBuild, pcBuild.Id);
        LogPcBuildPartsCreation(pcBuild);
        return mapper.Map<PcBuildDto>(pcBuild);
    }

    private void LogPcBuildPartsCreation(PcBuild pcBuild)
    {
        foreach (var part in pcBuild.Parts)
            EntityLog.Created(logger, EntityLog.PcBuildPart, part.Id);
    }
}
