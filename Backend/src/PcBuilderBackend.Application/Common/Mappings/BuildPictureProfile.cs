using AutoMapper;
using PcBuilderBackend.Application.Build.Dto;
using PcBuilderBackend.Domain.Entities;

namespace PcBuilderBackend.Application.Common.Mappings;

public class BuildPictureProfile : Profile
{
    public BuildPictureProfile()
    {
        CreateMap<BuildPicture, BuildPictureDto>();
    }
}
