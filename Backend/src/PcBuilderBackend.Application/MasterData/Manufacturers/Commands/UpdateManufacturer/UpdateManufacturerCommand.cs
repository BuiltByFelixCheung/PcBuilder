using MediatR;
using PcBuilderBackend.Application.MasterData.Manufacturers.Dto;
using PcBuilderBackend.Application.MasterData.Manufacturers;
using PcBuilderBackend.Domain.Enums;

namespace PcBuilderBackend.Application.MasterData.Manufacturers.Commands.UpdateManufacturer;

public record UpdateManufacturerCommand(Guid Id, string Name, List<ProductType>? ProductTypes = null)
    : IRequest<ManufacturerDto?>, IManufacturerFields;
