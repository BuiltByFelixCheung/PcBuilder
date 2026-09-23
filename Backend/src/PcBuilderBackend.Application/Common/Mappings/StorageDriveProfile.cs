using AutoMapper;
using PcBuilderBackend.Application.Catalog.StorageDrives.Dto;
using PcBuilderBackend.Domain.Entities;

namespace PcBuilderBackend.Application.Common.Mappings;

public class StorageDriveProfile : Profile
{
    public StorageDriveProfile()
    {
        CreateMap<StorageDrive, StorageDriveDto>()
            .ForMember(d => d.ManufacturerName, o => o.MapFrom(s => s.Manufacturer.Name));
    }
}
