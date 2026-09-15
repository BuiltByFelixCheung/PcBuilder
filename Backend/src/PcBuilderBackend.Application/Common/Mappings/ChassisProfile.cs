using AutoMapper;
using PcBuilderBackend.Application.Catalog.Chassis.Dto;
using PcBuilderBackend.Domain.Entities;

namespace PcBuilderBackend.Application.Common.Mappings;

public class ChassisProfile : Profile
{
    public ChassisProfile()
    {
        CreateMap<ChassisFanMountOption, ChassisFanMountOptionDto>();

        CreateMap<ChassisFanMount, ChassisFanMountDto>()
            .ForCtorParam(nameof(ChassisFanMountDto.Options), o => o.MapFrom(s => s.Options.Where(x => x.IsActive)))
            .ForMember(d => d.Options, o => o.MapFrom(s => s.Options.Where(x => x.IsActive)));

        CreateMap<ChassisDriveBay, ChassisDriveBayDto>()
            .ForCtorParam(nameof(ChassisDriveBayDto.FormFactor), o => o.MapFrom(s => s.DriveBayFormFactor))
            .ForCtorParam(nameof(ChassisDriveBayDto.SlotCount), o => o.MapFrom(s => s.BayCount))
            .ForMember(d => d.FormFactor, o => o.MapFrom(s => s.DriveBayFormFactor))
            .ForMember(d => d.SlotCount, o => o.MapFrom(s => s.BayCount));

        CreateMap<ChassisPcieSlot, ChassisPcieSlotDto>();

        CreateMap<ChassisRadiator, ChassisRadiatorDto>()
            .ForMember(d => d.Location, o => o.MapFrom(s => s.MountLocation));

        CreateMap<Chassis, ChassisListItemDto>()
            .ForMember(d => d.ManufacturerName, o => o.MapFrom(s => s.Manufacturer.Name));

        CreateMap<Chassis, ChassisDto>()
            .IncludeBase<Chassis, ChassisListItemDto>()
            .ForMember(d => d.ManufacturerName, o => o.MapFrom(s => s.Manufacturer.Name))
            .ForMember(d => d.FanMounts, o => o.MapFrom(s => s.FanMounts.Where(x => x.IsActive)))
            .ForMember(d => d.DriveBays, o => o.MapFrom(s => s.DriveBays.Where(x => x.IsActive)))
            .ForMember(d => d.PcieSlots, o => o.MapFrom(s => s.PcieSlots.Where(x => x.IsActive)))
            .ForMember(d => d.Radiators, o => o.MapFrom(s => s.Radiators.Where(x => x.IsActive)))
            .ForMember(
                d => d.PsuFormFactors,
                o => o.MapFrom(s => s.PsuFormFactors.Where(x => x.IsActive).Select(x => x.PsuFormFactor)))
            .ForMember(
                d => d.MbFormFactors,
                o => o.MapFrom(s => s.MbFormFactors.Where(x => x.IsActive).Select(x => x.MbFormFactor)));
    }
}
