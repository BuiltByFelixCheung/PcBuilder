using System.Linq.Expressions;
using PcBuilderBackend.Domain.Entities;
using PcBuilderBackend.Domain.Enums;

namespace PcBuilderBackend.Domain.Compatibility;

public static class M2KeyCompatibility
{
    internal static readonly Expression<Func<M2Key?, M2Key, bool>> FitsExpression =
        (moduleKey, slotKey) =>
            moduleKey != null
            && (moduleKey == slotKey
                || (moduleKey == M2Key.BM && (slotKey == M2Key.M || slotKey == M2Key.B)));

    private static readonly Func<M2Key?, M2Key, bool> FitsCompiled = FitsExpression.Compile();

    public static bool FitsSlot(M2Key moduleKey, M2Key slotKey) => FitsCompiled(moduleKey, slotKey);
}

public static class StorageDriveCompatibility
{
    internal static readonly Expression<Func<StorageFormFactor, bool>> IsM2FormExpression =
        form => form == StorageFormFactor.M22230
            || form == StorageFormFactor.M22242
            || form == StorageFormFactor.M22260
            || form == StorageFormFactor.M22280
            || form == StorageFormFactor.M222110;

    private static readonly Func<StorageFormFactor, bool> IsM2FormCompiled = IsM2FormExpression.Compile();

    private static readonly Expression<Func<StorageFormFactor, StorageInterface, M2Key?>> ModuleKeyExpression =
        BuildModuleKey();

    private static readonly Func<StorageFormFactor, StorageInterface, M2Key?> ModuleKeyCompiled =
        ModuleKeyExpression.Compile();

    private static readonly Expression<Func<StorageFormFactor, M2FormFactor?>> M2FormExpression = BuildM2Form();

    private static readonly Func<StorageFormFactor, M2FormFactor?> M2FormCompiled = M2FormExpression.Compile();

    private static readonly Expression<Func<StorageDrive, M2Key, M2FormFactor, bool, int, bool>> SlotAccepts =
        BuildSlotAccepts();

    public static bool IsM2Form(StorageFormFactor form) => IsM2FormCompiled(form);

    public static M2Key? ModuleKey(StorageFormFactor form, StorageInterface iface) =>
        ModuleKeyCompiled(form, iface);

    public static M2FormFactor? ToM2FormFactor(StorageFormFactor form) => M2FormCompiled(form);

    public static Expression<Func<StorageDrive, bool>> M2SlotFits(
        M2Key slotKey,
        M2FormFactor slotFormFactor,
        bool supportsSata,
        int slotCount) =>
        CompatibilityExpression.Bind(SlotAccepts, slotKey, slotFormFactor, supportsSata, slotCount);

    private static Expression<Func<StorageFormFactor, M2FormFactor?>> BuildM2Form()
    {
        var form = Expression.Parameter(typeof(StorageFormFactor), "form");
        Expression body = Expression.Constant(null, typeof(M2FormFactor?));
        (StorageFormFactor Storage, M2FormFactor M2)[] pairs =
        [
            (StorageFormFactor.M22230, M2FormFactor.M22230),
            (StorageFormFactor.M22242, M2FormFactor.M22242),
            (StorageFormFactor.M22260, M2FormFactor.M22260),
            (StorageFormFactor.M22280, M2FormFactor.M22280),
            (StorageFormFactor.M222110, M2FormFactor.M222110)
        ];

        for (var i = pairs.Length - 1; i >= 0; i--)
        {
            body = Expression.Condition(
                Expression.Equal(form, Expression.Constant(pairs[i].Storage)),
                Expression.Constant((M2FormFactor?)pairs[i].M2, typeof(M2FormFactor?)),
                body);
        }

        return Expression.Lambda<Func<StorageFormFactor, M2FormFactor?>>(body, form);
    }

    private static Expression<Func<StorageFormFactor, StorageInterface, M2Key?>> BuildModuleKey()
    {
        var form = Expression.Parameter(typeof(StorageFormFactor), "form");
        var iface = Expression.Parameter(typeof(StorageInterface), "iface");
        var isM2 = CompatibilityExpression.Inline(IsM2FormExpression, form);
        var whenM2 = Expression.Condition(
            Expression.Equal(iface, Expression.Constant(StorageInterface.Sata)),
            Expression.Constant((M2Key?)M2Key.BM, typeof(M2Key?)),
            Expression.Constant((M2Key?)M2Key.M, typeof(M2Key?)));
        var body = Expression.Condition(isM2, whenM2, Expression.Constant(null, typeof(M2Key?)));
        return Expression.Lambda<Func<StorageFormFactor, StorageInterface, M2Key?>>(body, form, iface);
    }

    private static Expression<Func<StorageDrive, M2Key, M2FormFactor, bool, int, bool>> BuildSlotAccepts()
    {
        var drive = Expression.Parameter(typeof(StorageDrive), "drive");
        var slotKey = Expression.Parameter(typeof(M2Key), "slotKey");
        var slotForm = Expression.Parameter(typeof(M2FormFactor), "slotForm");
        var supportsSata = Expression.Parameter(typeof(bool), "supportsSata");
        var slotCount = Expression.Parameter(typeof(int), "slotCount");
        var form = Expression.Property(drive, nameof(StorageDrive.FormFactor));
        var iface = Expression.Property(drive, nameof(StorageDrive.Interface));

        var isM2 = CompatibilityExpression.Inline(IsM2FormExpression, form);
        var moduleKey = CompatibilityExpression.Inline(ModuleKeyExpression, form, iface);
        var fits = CompatibilityExpression.Inline(M2KeyCompatibility.FitsExpression, moduleKey, slotKey);
        var m2Form = CompatibilityExpression.Inline(M2FormExpression, form);
        var formMatches = Expression.Equal(m2Form, Expression.Convert(slotForm, typeof(M2FormFactor?)));
        var sataOk = Expression.OrElse(
            Expression.NotEqual(iface, Expression.Constant(StorageInterface.Sata)),
            supportsSata);
        var countOk = Expression.GreaterThan(slotCount, Expression.Constant(0));
        var body = Expression.AndAlso(
            isM2,
            Expression.AndAlso(
                countOk,
                Expression.AndAlso(fits, Expression.AndAlso(formMatches, sataOk))));

        return Expression.Lambda<Func<StorageDrive, M2Key, M2FormFactor, bool, int, bool>>(
            body,
            drive,
            slotKey,
            slotForm,
            supportsSata,
            slotCount);
    }
}
