using AutoMapper;
using MediatR;
using Microsoft.Extensions.Logging;
using PcBuilderBackend.Application.Catalog.CpuCoolers;
using PcBuilderBackend.Application.Catalog.CpuCoolers.Dto;
using PcBuilderBackend.Application.Common.Interfaces;
using PcBuilderBackend.Application.Common.Logging;
using PcBuilderBackend.Domain.Entities;

namespace PcBuilderBackend.Application.Catalog.CpuCoolers.Commands.CreateCpuCooler;

public class CreateCpuCoolerHandler(
    ICpuCoolerRepository cpuCoolers,
    IUnitOfWork unitOfWork,
    IMapper mapper,
    ILogger<CreateCpuCoolerHandler> logger)
    : IRequestHandler<CreateCpuCoolerCommand, CpuCoolerDto>
{
    public async Task<CpuCoolerDto> Handle(CreateCpuCoolerCommand request, CancellationToken cancellationToken)
    {
        var entity = new CpuCooler(request.ManufacturerId, request.Name, request.ToSpecs());

        ApplySockets(entity, request.Sockets);

        cpuCoolers.Add(entity);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        EntityLog.Created(logger, EntityLog.CpuCooler, entity.Id);

        return mapper.Map<CpuCoolerDto>(entity);
    }

    internal static void ApplySockets(CpuCooler entity, IEnumerable<CpuCoolerSocketDto> sockets)
    {
        foreach (var socketId in sockets.Select(s => s.SocketId).Distinct())
        {
            entity.AddCpuCoolerSocket(new CpuCoolerSocket(entity.Id, socketId));
        }
    }
}
