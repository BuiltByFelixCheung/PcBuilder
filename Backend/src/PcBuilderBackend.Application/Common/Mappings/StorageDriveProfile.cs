using AutoMapper;
using PcBuilderBackend.Application.Catalog.StorageDrives.Dto;
using PcBuilderBackend.Domain.Entities;
using PcBuilderBackend.Domain.Enums;

namespace PcBuilderBackend.Application.Common.Mappings;

public class StorageDriveProfile : Profile
{
    public StorageDriveProfile()
    {
        CreateMap<StorageDrive, StorageDriveDto>()
            .ForMember(d => d.ManufacturerName, o => o.MapFrom(s => s.Manufacturer.Name))
            .ForMember(d => d.IsM2, o => o.MapFrom(s =>
                s.FormFactor == StorageFormFactor.M22230
                || s.FormFactor == StorageFormFactor.M22242
                || s.FormFactor == StorageFormFactor.M22260
                || s.FormFactor == StorageFormFactor.M22280
                || s.FormFactor == StorageFormFactor.M222110))
            .ForMember(d => d.ModuleKey, o => o.MapFrom(s =>
                s.FormFactor == StorageFormFactor.M22230
                || s.FormFactor == StorageFormFactor.M22242
                || s.FormFactor == StorageFormFactor.M22260
                || s.FormFactor == StorageFormFactor.M22280
                || s.FormFactor == StorageFormFactor.M222110
                    ? s.Interface == StorageInterface.Sata ? M2Key.BM : M2Key.M
                    : (M2Key?)null))
            .ForMember(d => d.M2FormFactor, o => o.MapFrom(s =>
                s.FormFactor == StorageFormFactor.M22230 ? (M2FormFactor?)M2FormFactor.M22230
                : s.FormFactor == StorageFormFactor.M22242 ? M2FormFactor.M22242
                : s.FormFactor == StorageFormFactor.M22260 ? M2FormFactor.M22260
                : s.FormFactor == StorageFormFactor.M22280 ? M2FormFactor.M22280
                : s.FormFactor == StorageFormFactor.M222110 ? M2FormFactor.M222110
                : null));
    }
}
