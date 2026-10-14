using FluentValidation;
using PcBuilderBackend.Application.Catalog.Motherboards.Commands.BulkCreateMotherboards;
using PcBuilderBackend.Application.Common.Interfaces;
using PcBuilderBackend.Application.Common.Validation;
using PcBuilderBackend.Domain.Enums;
using PcBuilderBackend.Domain.ValueObjects;

namespace PcBuilderBackend.Application.Catalog.Motherboards.Validators;

public class BulkCreateMotherboardsCommandValidator : AbstractValidator<BulkCreateMotherboardCommand>
{
    public BulkCreateMotherboardsCommandValidator(IActiveEntityLookup db)
    {
        RuleFor(x => x.Motherboards)
            .NotEmpty().WithMessage("At least one motherboard is required");

        RuleFor(x => x.Motherboards.Select(m => m.ManufacturerId))
            .MustAllBeActiveManufacturers(db)
            .When(x => x.Motherboards is { Count: > 0 });
        RuleFor(x => x.Motherboards.Select(m => m.SocketId))
            .MustAllBeActiveSockets(db)
            .When(x => x.Motherboards is { Count: > 0 });
        RuleFor(x => x.Motherboards.Select(m => m.ChipsetId))
            .MustAllBeActiveChipsets(db)
            .When(x => x.Motherboards is { Count: > 0 });

        RuleForEach(x => x.Motherboards).ChildRules(board =>
        {
            board.RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Name is required")
                .MaximumLength(200);

            board.RuleFor(x => x.ManufacturerId)
                .NotEmpty().WithMessage("ManufacturerId is required");

            board.RuleFor(x => x.SocketId)
                .NotEmpty().WithMessage("SocketId is required");

            board.RuleFor(x => x.ChipsetId)
                .NotEmpty().WithMessage("ChipsetId is required");

            board.RuleFor(x => x.RamSlots)
                .GreaterThan(0).WithMessage("RamSlots must be greater than 0");

            board.RuleFor(x => x.MaxMemoryGb)
                .GreaterThan(0).WithMessage("MaxMemoryGb must be greater than 0");

            board.RuleFor(x => x.MaxDimmSizeGb)
                .GreaterThan(0).WithMessage("MaxDimmSizeGb must be greater than 0");

            board.RuleFor(x => x.SataPorts)
                .GreaterThan(0).WithMessage("SataPorts must be greater than 0");

            board.RuleFor(x => x.PwmFanHeaders)
                .GreaterThanOrEqualTo(0).WithMessage("PwmFanHeaders must be greater than or equal to 0");

            board.RuleFor(x => x.DcFanHeaders)
                .GreaterThanOrEqualTo(0).WithMessage("DcFanHeaders must be greater than or equal to 0");

            board.RuleFor(x => x)
                .Must(x => x.PwmFanHeaders + x.DcFanHeaders > 0)
                .WithMessage("At least one PWM or DC fan header is required");

            board.RuleFor(x => x.EpsConnectors)
                .GreaterThan(0).WithMessage("EpsConnectors must be greater than 0");

            board.RuleFor(x => x.WidthMm)
                .GreaterThan(0).WithMessage("WidthMm must be greater than 0");

            board.RuleFor(x => x.HeightMm)
                .GreaterThan(0).WithMessage("HeightMm must be greater than 0");

            board.RuleFor(x => x.DdrGeneration)
                .IsInEnum().WithMessage("DdrGeneration is invalid");

            board.RuleFor(x => x.RamFormFactor)
                .IsInEnum().WithMessage("RamFormFactor is invalid");

            board.RuleFor(x => x.FormFactor)
                .IsInEnum().WithMessage("FormFactor is invalid");

            board.RuleFor(x => x.PcieSlots)
                .NotEmpty().WithMessage("PcieSlots is required")
                .Must(slots => slots
                    .Select(s => (s.SlotType, s.SlotLanes, s.Generation))
                    .Distinct()
                    .Count() == slots.Count)
                .WithMessage("Duplicate PCIe slots (same type, lanes, and generation) are not allowed.")
                .When(x => x.PcieSlots.Count > 0);

            board.RuleFor(x => x.M2Slots)
                .NotEmpty().WithMessage("M2Slots is required")
                .Must(slots => slots
                    .Select(s => MotherboardM2GroupKey.From(s.Key, s.PcieGeneration, s.SupportsSata, s.FormFactors))
                    .Distinct()
                    .Count() == slots.Count)
                .WithMessage("Duplicate M.2 slots (same key, PCIe generation, SATA support, and form factors) are not allowed.")
                .When(x => x.M2Slots.Count > 0);

            board.RuleFor(x => x.UsbPorts)
                .NotEmpty().WithMessage("UsbPorts is required")
                .Must(ports => ports
                    .Select(p => (p.UsbType, p.UsbVersion))
                    .Distinct()
                    .Count() == ports.Count)
                .WithMessage("Duplicate USB ports (same type and version) are not allowed.")
                .When(x => x.UsbPorts.Count > 0);

            board.RuleForEach(x => x.PcieSlots).ChildRules(slot =>
            {
                slot.RuleFor(x => x.Generation).IsInEnum().WithMessage("Generation is invalid");
                slot.RuleFor(x => x.SlotType).IsInEnum().WithMessage("SlotType is invalid");
                slot.RuleFor(x => x.SlotLanes).IsInEnum().WithMessage("SlotLane is invalid");
                slot.RuleFor(x => x.SlotCount).GreaterThan(0).WithMessage("SlotCount must be greater than 0");
            });

            board.RuleForEach(x => x.M2Slots).ChildRules(slot =>
            {
                slot.RuleFor(x => x.Key)
                    .Must(key => key.IsSlotKey())
                    .WithMessage("M.2 slot key must be M, B, or E");

                slot.RuleFor(x => x.SupportsSata)
                    .Equal(false)
                    .When(x => x.Key == M2Key.E)
                    .WithMessage("E-key slots cannot support SATA");

                slot.RuleFor(x => x.PcieGeneration).IsInEnum().WithMessage("PcieGeneration is invalid");
                slot.RuleFor(x => x.SlotCount).GreaterThan(0).WithMessage("SlotCount must be greater than 0");
            });

            board.RuleForEach(x => x.UsbPorts).ChildRules(port =>
            {
                port.RuleFor(x => x.UsbVersion).IsInEnum().WithMessage("UsbVersion is invalid");
                port.RuleFor(x => x.UsbType).IsInEnum().WithMessage("UsbType is invalid");
                port.RuleFor(x => x.PortCount).GreaterThan(0).WithMessage("PortCount must be greater than 0");
            });
        });
    }
}
