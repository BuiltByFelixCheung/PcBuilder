using MediatR;
using PcBuilderBackend.Application.Catalog.GraphicsCards.Dto;
using PcBuilderBackend.Application.Catalog.GraphicsCards;

namespace PcBuilderBackend.Application.Catalog.GraphicsCards.Commands.UpdateGraphicsCard;

public record UpdateGraphicsCardCommand : GraphicsCardWriteFields, IRequest<GraphicsCardDto?>
{
    public Guid Id { get; init; }
}
