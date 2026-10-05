using MediatR;
using PcBuilderBackend.Application.Auth.Dto;

namespace PcBuilderBackend.Application.Auth.Commands.Register;

public record RegisterCommand(
    string Email,
    string Password,
    string UserName) : IRequest<RegisterResultDto>;
