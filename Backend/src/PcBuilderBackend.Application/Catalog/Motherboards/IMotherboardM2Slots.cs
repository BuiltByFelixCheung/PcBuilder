using PcBuilderBackend.Application.Catalog.Motherboards.Dto;

namespace PcBuilderBackend.Application.Catalog.Motherboards;

public interface IMotherboardM2Slots
{
    List<MotherboardM2Dto> M2Slots { get; }
}
