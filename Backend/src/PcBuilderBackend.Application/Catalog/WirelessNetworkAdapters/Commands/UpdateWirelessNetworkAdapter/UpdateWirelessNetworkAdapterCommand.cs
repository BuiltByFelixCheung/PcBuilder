using MediatR;
using PcBuilderBackend.Application.Catalog.WirelessNetworkAdapters.Dto;
using PcBuilderBackend.Application.Catalog.WirelessNetworkAdapters;

namespace PcBuilderBackend.Application.Catalog.WirelessNetworkAdapters.Commands.UpdateWirelessNetworkAdapter;

public record UpdateWirelessNetworkAdapterCommand
    : WirelessNetworkAdapterWriteFields, IRequest<WirelessNetworkAdapterDto?>
{
    public Guid Id { get; init; }
}
