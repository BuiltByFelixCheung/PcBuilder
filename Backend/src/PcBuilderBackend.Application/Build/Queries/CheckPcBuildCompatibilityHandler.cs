using MediatR;
using PcBuilderBackend.Application.Build.Dto;

namespace PcBuilderBackend.Application.Build.Queries;

public class CheckPcBuildCompatibilityHandler(ICompatibilityChecker checker)
    : IRequestHandler<CheckPcBuildCompatibilityQuery, CompatibilityCheckDto>
{
    public async Task<CompatibilityCheckDto> Handle(
        CheckPcBuildCompatibilityQuery query,
        CancellationToken cancellationToken)
    {
        var checks = await checker.CheckCompatibilityAsync(
            new CompatibilityCheckRequest
            {
                ChassisId = query.ChassisId,
                MotherboardId = query.MotherboardId,
                CpuId = query.CpuId,
                CpuCoolerId = query.CpuCoolerId,
                RamKitId = query.RamKitId,
                GraphicsCardId = query.GraphicsCardId,
                PsuId = query.PsuId,
                ChassisFans = query.ChassisFans,
                StorageDevices = query.StorageDevices,
                WiredNetworkAdapters = query.WiredNetworkAdapters,
                WirelessNetworkAdapters = query.WirelessNetworkAdapters
            });

        return CompatibilityCheckDto.From(checks);
    }
}
