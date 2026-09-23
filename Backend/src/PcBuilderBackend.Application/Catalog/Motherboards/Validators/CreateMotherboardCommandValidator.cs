using FluentValidation;
using PcBuilderBackend.Application.Catalog.Motherboards.Commands.CreateMotherboard;
using PcBuilderBackend.Application.Common.Interfaces;
using PcBuilderBackend.Application.Common.Validation;

namespace PcBuilderBackend.Application.Catalog.Motherboards.Validators;

public class CreateMotherboardCommandValidator : AbstractValidator<CreateMotherboardCommand>
{
    public CreateMotherboardCommandValidator(IActiveEntityLookup db)
    {
        Include(new MotherboardFieldsValidator<CreateMotherboardCommand>());
        RuleFor(x => x.ManufacturerId).MustBeActiveManufacturer(db);
        RuleFor(x => x.SocketId).MustBeActiveSocket(db);
        RuleFor(x => x.ChipsetId).MustBeActiveChipset(db);

        RuleFor(x => x.PcieSlots)
            .NotEmpty().WithMessage("PcieSlots is required")
            .Must(slots => slots
                .Select(s => (s.SlotType, s.SlotLanes, s.Generation))
                .Distinct()
                .Count() == slots.Count)
            .WithMessage("Duplicate PCIe slots (same type, lanes, and generation) are not allowed.")
            .When(x => x.PcieSlots.Count > 0);

        RuleFor(x => x.M2Slots)
            .NotEmpty().WithMessage("M2Slots is required");

        RuleFor(x => x.UsbPorts)
            .NotEmpty().WithMessage("UsbPorts is required");

        RuleForEach(x => x.PcieSlots).ChildRules(slot =>
        {
            slot.RuleFor(x => x.Generation)
                .IsInEnum().WithMessage("Generation is invalid");

            slot.RuleFor(x => x.SlotType)
                .IsInEnum().WithMessage("SlotType is invalid");

            slot.RuleFor(x => x.SlotLanes)
                .IsInEnum().WithMessage("SlotLane is invalid");

            slot.RuleFor(x => x.SlotCount)
                .GreaterThan(0).WithMessage("SlotCount must be greater than 0");
        });

        Include(new MotherboardM2SlotRulesValidator<CreateMotherboardCommand>());

        RuleFor(x => x.UsbPorts)
            .Must(ports => ports
                .Select(p => (p.UsbType, p.UsbVersion))
                .Distinct()
                .Count() == ports.Count)
            .WithMessage("Duplicate USB ports (same type and version) are not allowed.")
            .When(x => x.UsbPorts.Count > 0);

        RuleForEach(x => x.UsbPorts).ChildRules(port =>
        {
            port.RuleFor(x => x.UsbVersion).IsInEnum().WithMessage("UsbVersion is invalid");
            port.RuleFor(x => x.UsbType).IsInEnum().WithMessage("UsbType is invalid");
            port.RuleFor(x => x.PortCount).GreaterThan(0).WithMessage("PortCount must be greater than 0");
        });
    }
}
