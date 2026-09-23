using MediatR;
using PcBuilderBackend.Application.Catalog.Motherboards.Dto;
using PcBuilderBackend.Application.Catalog.Motherboards;

namespace PcBuilderBackend.Application.Catalog.Motherboards.Commands.CreateMotherboard;

public record CreateMotherboardCommand : MotherboardWriteFields, IRequest<MotherboardDto>, IMotherboardM2Slots
{
    public List<MotherboardPcieDto> PcieSlots { get; init; } = [];
    public List<MotherboardM2Dto> M2Slots { get; init; } = [];
    public List<MotherboardUsbDto> UsbPorts { get; init; } = [];
}
