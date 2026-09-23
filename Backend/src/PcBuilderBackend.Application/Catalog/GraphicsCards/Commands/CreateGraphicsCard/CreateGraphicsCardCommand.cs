using MediatR;
using PcBuilderBackend.Application.Catalog.GraphicsCards.Dto;
using PcBuilderBackend.Application.Catalog.GraphicsCards;

namespace PcBuilderBackend.Application.Catalog.GraphicsCards.Commands.CreateGraphicsCard;

public record CreateGraphicsCardCommand : GraphicsCardWriteFields, IRequest<GraphicsCardDto>;
