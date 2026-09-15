using AutoMapper;
using PcBuilderBackend.Application.Catalog.Motherboards.Dto;
using PcBuilderBackend.Domain.Entities;

namespace PcBuilderBackend.Application.Common.Mappings;

public class MotherboardProfile : Profile
{
    public MotherboardProfile()
    {
        CreateMap<Motherboard, MotherboardListItemDto>()
            .ForMember(d => d.ManufacturerName, o => o.MapFrom(s => s.Manufacturer.Name))
            .ForMember(d => d.SocketName, o => o.MapFrom(s => s.Socket.Name))
            .ForMember(d => d.ChipsetName, o => o.MapFrom(s => s.Chipset.Name));

        CreateMap<Motherboard, MotherboardDto>()
            .IncludeBase<Motherboard, MotherboardListItemDto>()
            .ForMember(d => d.ManufacturerName, o => o.MapFrom(s => s.Manufacturer.Name))
            .ForMember(d => d.SocketName, o => o.MapFrom(s => s.Socket.Name))
            .ForMember(d => d.ChipsetName, o => o.MapFrom(s => s.Chipset.Name))
            .ForMember(d => d.PcieSlots, o => o.MapFrom(s => s.PcieSlots.Where(x => x.IsActive)))
            .ForMember(d => d.M2Slots, o => o.MapFrom(s => s.M2Slots.Where(x => x.IsActive)))
            .ForMember(d => d.UsbPorts, o => o.MapFrom(s => s.UsbPorts.Where(x => x.IsActive)));

        CreateMap<MotherboardPcie, MotherboardPcieDto>();
        CreateMap<MotherboardM2, MotherboardM2Dto>()
            .ForMember(
                dest => dest.FormFactors,
                opt => opt.MapFrom(src =>
                    src.FormFactors.Where(f => f.IsActive).Select(f => f.FormFactor).ToList()));
        CreateMap<MotherboardUsb, MotherboardUsbDto>();
    }
}
