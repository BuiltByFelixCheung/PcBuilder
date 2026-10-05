using MediatR;
using PcBuilderBackend.Application.Auth.Dto;
using PcBuilderBackend.Application.Common.Interfaces;

namespace PcBuilderBackend.Application.Auth.Commands.Register;

public class RegisterHandler(IIdentityService identityService)
    : IRequestHandler<RegisterCommand, RegisterResultDto>
{
    public Task<RegisterResultDto> Handle(RegisterCommand request, CancellationToken cancellationToken)
    {
        return identityService.RegisterMemberAsync(
            request.Email,
            request.Password,
            request.UserName,
            cancellationToken);
    }
}
