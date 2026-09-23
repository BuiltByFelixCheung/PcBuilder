using MediatR;
using PcBuilderBackend.Application.Catalog.Motherboards.Dto;
using PcBuilderBackend.Application.Catalog.Motherboards;

namespace PcBuilderBackend.Application.Catalog.Motherboards.Commands.UpdateMotherboard;

public record UpdateMotherboardCommand : MotherboardWriteFields, IRequest<MotherboardDto?>
{
    public Guid Id { get; init; }
}
