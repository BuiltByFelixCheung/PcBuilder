using PcBuilderBackend.Application.Catalog.Motherboards;

namespace PcBuilderBackend.Application.Catalog.Motherboards.Dto;

public record MotherboardImportRow : MotherboardWriteFields
{
    public int RowNumber { get; init; }
    public List<MotherboardPcieImportRow> PcieSlots { get; init; } = [];
    public List<MotherboardM2ImportRow> M2Slots { get; init; } = [];
    public List<MotherboardUsbImportRow> UsbPorts { get; init; } = [];
}
