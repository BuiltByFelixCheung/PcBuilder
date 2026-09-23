using MediatR;
using PcBuilderBackend.Application.Build.Dto;

namespace PcBuilderBackend.Application.Build.Commands.CreatePcBuild;

public record CreatePcBuildCommand(
    string Name,
    string? Description,
    Guid ChassisId,
    Guid MotherboardId,
    Guid CpuId,
    Guid? CpuCoolerId,
    Guid RamKitId,
    Guid? GraphicsCardId,
    Guid PsuId,
    List<PcBuildPartDto> ChassisFans,
    List<PcBuildPartDto> StorageDevices,
    List<PcBuildPartDto> WiredNetworkAdapters,
    List<PcBuildPartDto> WirelessNetworkAdapters) : IRequest<PcBuildDto>, IPcBuildFields;
