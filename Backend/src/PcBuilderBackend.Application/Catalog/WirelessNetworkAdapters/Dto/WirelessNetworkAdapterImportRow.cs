using PcBuilderBackend.Application.Catalog.WirelessNetworkAdapters;

namespace PcBuilderBackend.Application.Catalog.WirelessNetworkAdapters.Dto;

public record WirelessNetworkAdapterImportRow : WirelessNetworkAdapterWriteFields
{
    public int RowNumber { get; init; }
}
