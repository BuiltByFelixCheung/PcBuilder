using FluentValidation;
using PcBuilderBackend.Application.Catalog.Chassis.Dto;
using PcBuilderBackend.Application.Catalog.Chassis;

namespace PcBuilderBackend.Application.Catalog.Chassis.Validators;

public sealed class ChassisFieldsValidator<T> : AbstractValidator<T>
    where T : IChassisFields
{
    public ChassisFieldsValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.ManufacturerId).NotEmpty();
        RuleFor(x => x.LengthMm).GreaterThan(0);
        RuleFor(x => x.WidthMm).GreaterThan(0);
        RuleFor(x => x.HeightMm).GreaterThan(0);
        RuleFor(x => x.MotherboardMaxWidthMm).GreaterThan(0);
        RuleFor(x => x.MotherboardMaxHeightMm).GreaterThan(0);
        RuleFor(x => x.MaxCpuCoolerHeightMm).GreaterThan(0);
        RuleFor(x => x.MaxGraphicsCardLengthMm).GreaterThan(0);
        RuleFor(x => x.MaxPsuLengthMm).GreaterThan(0);
    }
}

public sealed class ChassisCollectionRulesValidator<T> : AbstractValidator<T>
    where T : IChassisCollections
{
    public ChassisCollectionRulesValidator()
    {
        RuleFor(x => x.DriveBays)
            .Must(BeUniqueDriveBayFormFactors)
            .WithMessage("Duplicate drive bay size sets are not allowed.")
            .When(x => x.DriveBays.Count > 0);

        RuleForEach(x => x.DriveBays).ChildRules(bay =>
        {
            bay.RuleFor(b => b.FormFactors).NotEmpty();
            bay.RuleForEach(b => b.FormFactors).IsInEnum();
            bay.RuleFor(b => b.FormFactors)
                .Must(factors => factors.Distinct().Count() == factors.Length)
                .WithMessage("A drive bay cannot list the same size twice.");
            bay.RuleFor(b => b.SlotCount).GreaterThan(0);
        });

        RuleFor(x => x.FanMounts)
            .Must(BeUniqueFanMountLocations)
            .WithMessage("Duplicate fan mount locations are not allowed.")
            .When(x => x.FanMounts.Count > 0);

        RuleForEach(x => x.FanMounts).ChildRules(mount =>
        {
            mount.RuleFor(m => m.Location).IsInEnum();
            mount.RuleFor(m => m.Options)
                .Must(BeUniqueFanMountOptionDiameters)
                .WithMessage("Duplicate fan mount option diameters are not allowed.")
                .When(m => m.Options.Count > 0);

            mount.RuleForEach(m => m.Options).ChildRules(option =>
            {
                option.RuleFor(o => o.Diameter).IsInEnum();
                option.RuleFor(o => o.SlotCount).GreaterThan(0);
            });
        });

        RuleFor(x => x.PcieSlots)
            .Must(BeUniquePcieSlots)
            .WithMessage("Duplicate PCIe slots (same LowProfileSlots and Orientation) are not allowed.")
            .When(x => x.PcieSlots.Count > 0);

        RuleForEach(x => x.PcieSlots).ChildRules(slot =>
        {
            slot.RuleFor(s => s.Orientation).IsInEnum();
            slot.RuleFor(s => s.SlotCount).GreaterThan(0);
        });

        RuleFor(x => x.Radiators)
            .Must(BeUniqueRadiators)
            .WithMessage("Duplicate radiators (same Length and Location) are not allowed.")
            .When(x => x.Radiators.Count > 0);

        RuleForEach(x => x.Radiators).ChildRules(radiator =>
        {
            radiator.RuleFor(r => r.Length).IsInEnum();
            radiator.RuleFor(r => r.Location).IsInEnum();
            radiator.RuleFor(r => r.RadiatorCount).GreaterThan(0);
        });

        RuleForEach(x => x.MbFormFactors).IsInEnum();
        RuleForEach(x => x.PsuFormFactors).IsInEnum();
    }

    private static bool BeUniqueDriveBayFormFactors(List<ChassisDriveBayDto> bays) =>
        bays.Select(bay => string.Join(',', bay.FormFactors.Order())).Distinct().Count() == bays.Count;

    private static bool BeUniqueFanMountLocations(List<ChassisFanMountDto> mounts) =>
        mounts.GroupBy(x => x.Location).All(g => g.Count() == 1);

    private static bool BeUniqueFanMountOptionDiameters(List<ChassisFanMountOptionDto> options) =>
        options.GroupBy(x => x.Diameter).All(g => g.Count() == 1);

    private static bool BeUniquePcieSlots(List<ChassisPcieSlotDto> slots) =>
        slots.GroupBy(x => (x.LowProfileSlots, x.Orientation)).All(g => g.Count() == 1);

    private static bool BeUniqueRadiators(List<ChassisRadiatorDto> radiators) =>
        radiators.GroupBy(x => (x.Length, x.Location)).All(g => g.Count() == 1);
}
