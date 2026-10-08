using System.Linq.Expressions;
using PcBuilderBackend.Domain.Entities;
using PcBuilderBackend.Domain.Enums;

namespace PcBuilderBackend.Domain.Compatibility;

public static class ChassisMotherboardCompatibility
{
    private static readonly Expression<Func<Motherboard, List<MbFormFactor>, decimal, decimal, bool>> Body =
        (board, formFactors, maxHeightMm, maxWidthMm) =>
            formFactors.Contains(board.FormFactor)
            && board.HeightMm <= maxHeightMm
            && board.WidthMm <= maxWidthMm;

    private static readonly Func<Motherboard, List<MbFormFactor>, decimal, decimal, bool> Compiled = Body.Compile();

    public static bool Matches(Chassis chassis, Motherboard board) =>
        Compiled(board, FormFactors(chassis), chassis.MotherboardMaxHeightMm, chassis.MotherboardMaxWidthMm);

    public static Expression<Func<Motherboard, bool>> Filter(Chassis chassis)
    {
        var formFactors = FormFactors(chassis);
        if (formFactors.Count == 0)
            return board => false;

        return CompatibilityExpression.Bind(
            Body,
            formFactors,
            chassis.MotherboardMaxHeightMm,
            chassis.MotherboardMaxWidthMm);
    }

    private static List<MbFormFactor> FormFactors(Chassis chassis) =>
        chassis.MbFormFactors.Select(factor => factor.MbFormFactor).ToList();
}

public static class ChassisPsuCompatibility
{
    private static readonly Expression<Func<Psu, List<PsuFormFactor>, decimal, bool>> Body =
        (psu, formFactors, maxLengthMm) =>
            formFactors.Contains(psu.FormFactor) && psu.LengthMm <= maxLengthMm;

    private static readonly Func<Psu, List<PsuFormFactor>, decimal, bool> Compiled = Body.Compile();

    public static bool Matches(Chassis chassis, Psu psu) =>
        Compiled(psu, FormFactors(chassis), chassis.MaxPsuLengthMm);

    public static Expression<Func<Psu, bool>> Filter(Chassis chassis)
    {
        var formFactors = FormFactors(chassis);
        if (formFactors.Count == 0)
            return psu => false;

        return CompatibilityExpression.Bind(Body, formFactors, chassis.MaxPsuLengthMm);
    }

    private static List<PsuFormFactor> FormFactors(Chassis chassis) =>
        chassis.PsuFormFactors.Select(factor => factor.PsuFormFactor).ToList();
}

public static class ChassisCpuCoolerCompatibility
{
    private static readonly Expression<Func<CpuCooler, decimal, List<RadiatorClass>, bool>> Body =
        (cooler, maxAirHeightMm, radiatorLengths) =>
            cooler.Type == CpuCoolerType.Air
                ? cooler.CoolerHeightMm <= maxAirHeightMm
                : cooler.Type == CpuCoolerType.Water
                  && cooler.RadiatorClass != null
                  && radiatorLengths.Contains(cooler.RadiatorClass.Value);

    private static readonly Expression<Func<CpuCooler, decimal, bool>> AirOnly =
        (cooler, maxAirHeightMm) =>
            cooler.Type == CpuCoolerType.Air && cooler.CoolerHeightMm <= maxAirHeightMm;

    private static readonly Func<CpuCooler, decimal, List<RadiatorClass>, bool> Compiled = Body.Compile();

    public static bool Matches(Chassis chassis, CpuCooler cooler) =>
        Compiled(cooler, chassis.MaxCpuCoolerHeightMm, RadiatorLengths(chassis));

    public static Expression<Func<CpuCooler, bool>> Filter(Chassis chassis)
    {
        var lengths = RadiatorLengths(chassis);
        if (lengths.Count == 0)
            return CompatibilityExpression.Bind(AirOnly, chassis.MaxCpuCoolerHeightMm);

        return CompatibilityExpression.Bind(Body, chassis.MaxCpuCoolerHeightMm, lengths);
    }

    private static List<RadiatorClass> RadiatorLengths(Chassis chassis) =>
        chassis.Radiators.Select(radiator => radiator.Length).Distinct().ToList();
}

public static class ChassisGraphicsCardCompatibility
{
    private static readonly Expression<Func<GraphicsCard, decimal, int, int, bool>> Body =
        (card, maxLengthMm, lowProfileSlots, fullHeightSlots) =>
            card.LengthMm <= maxLengthMm
            && card.PcieSlotsUsed <= (card.IsLowProfile ? lowProfileSlots : fullHeightSlots);

    private static readonly Func<GraphicsCard, decimal, int, int, bool> Compiled = Body.Compile();

    public static bool Matches(Chassis chassis, GraphicsCard card)
    {
        var (lowProfile, fullHeight) = SlotCapacity(chassis);
        return Compiled(card, chassis.MaxGraphicsCardLengthMm, lowProfile, fullHeight);
    }

    public static Expression<Func<GraphicsCard, bool>> Filter(Chassis chassis)
    {
        var (lowProfile, fullHeight) = SlotCapacity(chassis);
        return CompatibilityExpression.Bind(Body, chassis.MaxGraphicsCardLengthMm, lowProfile, fullHeight);
    }

    private static (int LowProfile, int FullHeight) SlotCapacity(Chassis chassis) =>
        (Count(chassis, lowProfile: true), Count(chassis, lowProfile: false));

    private static int Count(Chassis chassis, bool lowProfile)
    {
        var slots = chassis.PcieSlots.Where(slot => slot.LowProfileSlots == lowProfile);
        var horizontal = slots.Where(slot => slot.Orientation == PcieOrientation.Horizontal).Sum(slot => slot.SlotCount);
        var vertical = slots.Where(slot => slot.Orientation == PcieOrientation.Vertical).Sum(slot => slot.SlotCount);
        return horizontal + vertical;
    }
}

public static class ChassisStorageCompatibility
{
    private static readonly Expression<Func<int, int, int, int, int, bool>> Fits =
        (need25, need35, only25, only35, shared) =>
            need25 <= only25 + shared
            && need35 <= only35 + shared
            && need25 + need35 <= only25 + only35 + shared;

    private static readonly Func<int, int, int, int, int, bool> FitsCompiled = Fits.Compile();

    public static bool Matches(Chassis chassis, IEnumerable<StorageDrive> drives)
    {
        var (need25, need35) = CountDemand(drives);
        var (only25, only35, shared) = CountBays(chassis);
        return FitsCompiled(need25, need35, only25, only35, shared);
    }

    public static Expression<Func<StorageDrive, bool>> Filter(Chassis chassis)
    {
        var (only25, only35, shared) = CountBays(chassis);
        return CompatibilityExpression.Embed<StorageDrive>(
            Fits,
            drive => drive.FormFactor == StorageFormFactor.Sata25 ? 1 : 0,
            drive => drive.FormFactor == StorageFormFactor.Sata35 ? 1 : 0,
            only25,
            only35,
            shared);
    }

    private static (int Need25, int Need35) CountDemand(IEnumerable<StorageDrive> drives)
    {
        var required = drives
            .Select(drive => TryMapToDriveBay(drive.FormFactor))
            .Where(bay => bay.HasValue)
            .Select(bay => bay!.Value)
            .ToList();

        return (
            required.Count(size => size == DriveBayFormFactor.Inch25),
            required.Count(size => size == DriveBayFormFactor.Inch35));
    }

    private static (int Only25, int Only35, int Shared) CountBays(Chassis chassis) =>
        (
            BaySlots(chassis, accepts25: true, accepts35: false),
            BaySlots(chassis, accepts25: false, accepts35: true),
            BaySlots(chassis, accepts25: true, accepts35: true));

    private static int BaySlots(Chassis chassis, bool accepts25, bool accepts35) =>
        chassis.DriveBays
            .Where(bay => bay.DriveBayFormFactors.Contains(DriveBayFormFactor.Inch25) == accepts25
                && bay.DriveBayFormFactors.Contains(DriveBayFormFactor.Inch35) == accepts35)
            .Sum(bay => bay.BayCount);

    private static DriveBayFormFactor? TryMapToDriveBay(StorageFormFactor formFactor) => formFactor switch
    {
        StorageFormFactor.Sata25 => DriveBayFormFactor.Inch25,
        StorageFormFactor.Sata35 => DriveBayFormFactor.Inch35,
        _ => null
    };
}
