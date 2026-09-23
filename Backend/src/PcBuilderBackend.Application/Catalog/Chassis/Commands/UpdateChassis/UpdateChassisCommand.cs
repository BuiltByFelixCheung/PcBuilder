using MediatR;
using PcBuilderBackend.Application.Catalog.Chassis.Dto;
using PcBuilderBackend.Application.Catalog.Chassis;

namespace PcBuilderBackend.Application.Catalog.Chassis.Commands.UpdateChassis;

public record UpdateChassisCommand : ChassisNamedFields, IRequest<ChassisDto?>
{
    public Guid Id { get; init; }
}
