using FluentValidation;
using PcBuilderBackend.Application.MasterData.Manufacturers.Commands.CreateManufacturer;

namespace PcBuilderBackend.Application.MasterData.Manufacturers.Validators;

public class CreateManufacturerCommandValidator : AbstractValidator<CreateManufacturerCommand>
{
    public CreateManufacturerCommandValidator()
    {
        Include(new ManufacturerFieldsValidator<CreateManufacturerCommand>());
        RuleForEach(command => command.ProductTypes).IsInEnum();
    }
}
