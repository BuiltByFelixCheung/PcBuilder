using PcBuilderBackend.Application.Catalog.GraphicsCards;

namespace PcBuilderBackend.Application.Catalog.GraphicsCards.Dto;

public record GraphicsCardImportRow : GraphicsCardWriteFields
{
    public int RowNumber { get; init; }
}
