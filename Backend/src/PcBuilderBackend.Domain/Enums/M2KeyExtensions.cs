using PcBuilderBackend.Domain.Compatibility;

namespace PcBuilderBackend.Domain.Enums;

public static class M2KeyExtensions
{
    public static bool IsSlotKey(this M2Key key) =>
        key is M2Key.M or M2Key.B or M2Key.E;

    public static bool FitsSlot(this M2Key moduleKey, M2Key slotKey) =>
        M2KeyCompatibility.FitsSlot(moduleKey, slotKey);
}
