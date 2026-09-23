using PcBuilderBackend.Application.Catalog.Memories;

namespace PcBuilderBackend.Application.Catalog.Memories.Dto;

public record RamImportRow : MemoryWriteFields
{
    public int RowNumber { get; init; }
}
