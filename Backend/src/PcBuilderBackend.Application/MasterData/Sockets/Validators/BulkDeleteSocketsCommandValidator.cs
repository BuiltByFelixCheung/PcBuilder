using FluentValidation;
using PcBuilderBackend.Application.MasterData.Sockets.Commands.BulkDeleteSockets;

namespace PcBuilderBackend.Application.MasterData.Sockets.Validators;

public class BulkDeleteSocketsCommandValidator: AbstractValidator<BulkDeleteSocketsCommand>
{
    public BulkDeleteSocketsCommandValidator()
    {
        RuleFor(x => x.Ids).NotEmpty().WithMessage("SocketIds list cannot be empty.");
    }
}