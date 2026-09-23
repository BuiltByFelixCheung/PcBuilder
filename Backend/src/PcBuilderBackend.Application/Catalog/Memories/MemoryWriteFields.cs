using PcBuilderBackend.Domain.ValueObjects;

namespace PcBuilderBackend.Application.Catalog.Memories;

public abstract record MemoryWriteFields : RamSpecs, IMemoryFields
{
    public string Name { get; init; } = string.Empty;
    public Guid ManufacturerId { get; init; }
}
