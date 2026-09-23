using MediatR;
using PcBuilderBackend.Application.Catalog.Memories.Dto;
using PcBuilderBackend.Application.Catalog.Memories;

namespace PcBuilderBackend.Application.Catalog.Memories.Commands.UpdateMemory;

public record UpdateMemoryCommand : MemoryWriteFields, IRequest<RamDto?>
{
    public Guid Id { get; init; }
}
