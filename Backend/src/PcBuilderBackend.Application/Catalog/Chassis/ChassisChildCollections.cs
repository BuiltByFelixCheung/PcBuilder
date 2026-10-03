using PcBuilderBackend.Application.Catalog.Chassis.Dto;
using PcBuilderBackend.Domain.Entities;
using PcBuilderBackend.Domain.Enums;

namespace PcBuilderBackend.Application.Catalog.Chassis;

internal static class ChassisChildCollections
{
    public static void Apply(
        Domain.Entities.Chassis entity,
        IEnumerable<ChassisDriveBayDto> driveBays,
        IEnumerable<ChassisFanMountDto> fanMounts,
        IEnumerable<ChassisPcieSlotDto> pcieSlots,
        IEnumerable<ChassisRadiatorDto> radiators,
        IEnumerable<MbFormFactor> mbFormFactors,
        IEnumerable<PsuFormFactor> psuFormFactors)
    {
        foreach (var bay in driveBays)
            entity.AddDriveBay(new ChassisDriveBay(entity.Id, bay.FormFactors, bay.SlotCount));

        foreach (var mount in fanMounts)
            entity.AddFanMount(CreateFanMount(entity.Id, mount));

        foreach (var slot in pcieSlots)
        {
            entity.AddPcieSlot(new ChassisPcieSlot(
                entity.Id,
                slot.LowProfileSlots,
                slot.SlotCount,
                slot.Orientation));
        }

        foreach (var radiator in radiators)
        {
            entity.AddRadiator(new ChassisRadiator(
                entity.Id,
                radiator.Length,
                radiator.Location,
                radiator.RadiatorCount));
        }

        foreach (var formFactor in mbFormFactors.Distinct())
            entity.AddMbFormFactor(new ChassisMbFormFactor(entity.Id, formFactor));

        foreach (var formFactor in psuFormFactors.Distinct())
            entity.AddPsuFormFactor(new ChassisPsuFormFactor(entity.Id, formFactor));
    }

    private static ChassisFanMount CreateFanMount(Guid chassisId, ChassisFanMountDto mount)
    {
        var mountEntity = new ChassisFanMount(chassisId, mount.Location, mount.SingleDiameterOnly);

        foreach (var option in mount.Options)
        {
            mountEntity.AddOption(new ChassisFanMountOption(
                mountEntity.Id,
                option.Diameter,
                option.SlotCount));
        }

        return mountEntity;
    }
}
