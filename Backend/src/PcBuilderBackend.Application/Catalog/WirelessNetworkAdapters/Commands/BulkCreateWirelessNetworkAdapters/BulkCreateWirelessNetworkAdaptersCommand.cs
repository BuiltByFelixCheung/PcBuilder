using MediatR;
using PcBuilderBackend.Application.Catalog.WirelessNetworkAdapters.Dto;
using PcBuilderBackend.Application.Catalog.WirelessNetworkAdapters;

namespace PcBuilderBackend.Application.Catalog.WirelessNetworkAdapters.Commands.BulkCreateWirelessNetworkAdapters;

public record BulkCreateWirelessNetworkAdaptersCommand(List<CreateWirelessNetworkAdapterItem> Adapters)
    : IRequest<List<WirelessNetworkAdapterDto>>;

public record CreateWirelessNetworkAdapterItem : WirelessNetworkAdapterWriteFields;
