using MediatR;
using PcBuilderBackend.Application.Catalog.WirelessNetworkAdapters.Dto;
using PcBuilderBackend.Application.Catalog.WirelessNetworkAdapters;

namespace PcBuilderBackend.Application.Catalog.WirelessNetworkAdapters.Commands.CreateWirelessNetworkAdapter;

public record CreateWirelessNetworkAdapterCommand
    : WirelessNetworkAdapterWriteFields, IRequest<WirelessNetworkAdapterDto>;
