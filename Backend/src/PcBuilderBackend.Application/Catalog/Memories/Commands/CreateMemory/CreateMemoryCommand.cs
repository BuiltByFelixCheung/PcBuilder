using MediatR;
using PcBuilderBackend.Application.Catalog.Memories.Dto;
using PcBuilderBackend.Application.Catalog.Memories;

namespace PcBuilderBackend.Application.Catalog.Memories.Commands.CreateMemory;

public record CreateMemoryCommand : MemoryWriteFields, IRequest<RamDto>;
