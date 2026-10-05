using AutoMapper;
using PcBuilderBackend.Application.Build.Dto;
using PcBuilderBackend.Domain.Entities;
using PcBuilderBackend.Domain.Enums;

namespace PcBuilderBackend.Application.Common.Mappings;

public class PcBuildProfile : Profile
{
    public PcBuildProfile()
    {
        CreateMap<PcBuildPart, PcBuildPartDto>();

        CreateMap<Domain.Entities.PcBuild, PcBuildListItemDto>()
            .ForMember(d => d.UserId, o => o.MapFrom(s => s.User != null ? (Guid?)s.User.UserId : null))
            .ForMember(d => d.IsPublic, o => o.MapFrom(s => s.User != null && s.User.IsPublic))
            .ForMember(d => d.UserName, o => o.Ignore());

        CreateMap<Domain.Entities.PcBuild, PcBuildDto>()
            .IncludeBase<Domain.Entities.PcBuild, PcBuildListItemDto>()
            .ForMember(
                d => d.ChassisFans,
                o => o.MapFrom(s => s.Parts.Where(p => p.Type == PcBuildPartType.ChassisFan)))
            .ForMember(
                d => d.StorageDevices,
                o => o.MapFrom(s => s.Parts.Where(p => p.Type == PcBuildPartType.StorageDrive)))
            .ForMember(
                d => d.WiredNetworkAdapters,
                o => o.MapFrom(s => s.Parts.Where(p => p.Type == PcBuildPartType.WiredNetworkAdapter)))
            .ForMember(
                d => d.WirelessNetworkAdapters,
                o => o.MapFrom(s => s.Parts.Where(p => p.Type == PcBuildPartType.WirelessNetworkAdapter)));
    }
}
