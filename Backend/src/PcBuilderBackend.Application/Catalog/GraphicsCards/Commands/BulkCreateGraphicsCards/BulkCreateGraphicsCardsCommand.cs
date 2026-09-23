using MediatR;
using PcBuilderBackend.Application.Catalog.GraphicsCards.Dto;
using PcBuilderBackend.Application.Catalog.GraphicsCards;

namespace PcBuilderBackend.Application.Catalog.GraphicsCards.Commands.BulkCreateGraphicsCards;

public record BulkCreateGraphicsCardsCommand(List<CreateGraphicsCardItem> Cards)
    : IRequest<List<GraphicsCardDto>>;

public record CreateGraphicsCardItem : GraphicsCardWriteFields;
