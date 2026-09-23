using PcBuilderBackend.Domain.ValueObjects;

namespace PcBuilderBackend.Application.Catalog.GraphicsCards;

public abstract record GraphicsCardWriteFields : GraphicsCardSpecs, IGraphicsCardFields
{
    public string Name { get; init; } = string.Empty;
    public Guid ManufacturerId { get; init; }
}
