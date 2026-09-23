using MediatR;
using PcBuilderBackend.Application.Catalog.Chassis.Dto;
using PcBuilderBackend.Application.Catalog.Chassis;

namespace PcBuilderBackend.Application.Catalog.Chassis.Commands.CreateChassis;

public record CreateChassisCommand : ChassisWriteFields, IRequest<ChassisDto>;
