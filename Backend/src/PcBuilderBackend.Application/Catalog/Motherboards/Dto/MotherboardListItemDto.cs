using PcBuilderBackend.Application.Catalog.Motherboards;

namespace PcBuilderBackend.Application.Catalog.Motherboards.Dto;

public record MotherboardListItemDto : MotherboardWriteFields
{
    public Guid Id { get; init; }
    public string ManufacturerName { get; init; } = string.Empty;
    public string SocketName { get; init; } = string.Empty;
    public string ChipsetName { get; init; } = string.Empty;
}
