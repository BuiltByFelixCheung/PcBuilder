using AutoMapper;
using PcBuilderBackend.Application.Catalog.ProductPictures.Dto;
using PcBuilderBackend.Domain.Entities;

namespace PcBuilderBackend.Application.Common.Mappings;

public class ProductPictureProfile : Profile
{
    public ProductPictureProfile()
    {
        CreateMap<ProductPicture, ProductPictureDto>();
    }
}
