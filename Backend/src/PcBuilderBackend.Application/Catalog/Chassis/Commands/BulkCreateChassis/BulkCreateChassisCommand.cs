using MediatR;
using PcBuilderBackend.Application.Catalog.Chassis.Dto;
using PcBuilderBackend.Application.Catalog.Chassis;

namespace PcBuilderBackend.Application.Catalog.Chassis.Commands.BulkCreateChassis;

public record BulkCreateChassisCommand(List<CreateChassisItem> Items) : IRequest<List<ChassisDto>>;

public record CreateChassisItem : ChassisWriteFields;
