using MediatR;
using PcBuilderBackend.Application.MasterData.Manufacturers.Dto;
using PcBuilderBackend.Application.MasterData.Manufacturers;
using PcBuilderBackend.Domain.Enums;

namespace PcBuilderBackend.Application.MasterData.Manufacturers.Commands.CreateManufacturer;

public record CreateManufacturerCommand(string Name, List<ProductType>? ProductTypes = null)
    : IRequest<ManufacturerDto>, IManufacturerFields;
