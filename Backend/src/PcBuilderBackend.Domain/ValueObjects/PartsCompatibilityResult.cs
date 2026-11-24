using System.Globalization;
using PcBuilderBackend.Domain.Enums;

namespace PcBuilderBackend.Domain.ValueObjects;

/// <summary>
/// Compatibility outcome. Rated and executing values exist only for
/// <see cref="PartsCompatibility.CompatibleReduced"/>. Facts describe the
/// compared values for any non-compatible outcome.
/// </summary>
public abstract class PartsCompatibilityResult
{
    private protected PartsCompatibilityResult(
        PartsCompatibility status,
        CompatibilityReason reason,
        IReadOnlyList<CompatibilityFact>? facts = null)
    {
        Status = status;
        Reason = reason;
        Facts = facts is { Count: > 0 } ? facts : [];
    }

    public PartsCompatibility Status { get; }

    public CompatibilityReason Reason { get; }

    public IReadOnlyList<CompatibilityFact> Facts { get; }

    public static PartsCompatibilityResult Compatible()
    {
        return Valueless.Create(PartsCompatibility.Compatible, CompatibilityReason.None, []);
    }

    public static PartsCompatibilityResult Incompatible(
        CompatibilityReason reason,
        IReadOnlyList<CompatibilityFact>? facts = null)
    {
        return Valueless.Create(PartsCompatibility.Incompatible, reason, facts);
    }

    public static PartsCompatibilityResult CompatibleActionRequired(
        CompatibilityReason reason,
        IReadOnlyList<CompatibilityFact>? facts = null)
    {
        return Valueless.Create(PartsCompatibility.CompatibleActionRequired, reason, facts);
    }

    /// <summary>
    /// Compatible, but constrained: <paramref name="rated"/> is the advertised capability,
    /// <paramref name="executing"/> is what actually runs under the other part.
    /// The same pair is stored as a fact, with the limit equal to <paramref name="executing"/>
    /// and the actual value equal to <paramref name="rated"/>.
    /// </summary>
    public static PartsCompatibilityResult<T> CompatibleReduced<T>(
        CompatibilityReason reason,
        T rated,
        T executing)
    {
        return new PartsCompatibilityResult<T>(reason, rated, executing, ReducedFact(reason, rated, executing));
    }

    private static IReadOnlyList<CompatibilityFact> ReducedFact<T>(
        CompatibilityReason reason,
        T rated,
        T executing)
    {
        var aspect = reason switch
        {
            CompatibilityReason.MemorySpeedExceedsCpuSupport => CompatibilityAspect.MemorySpeedMts,
            CompatibilityReason.PcieGenerationReduced => CompatibilityAspect.PcieGeneration,
            CompatibilityReason.UsbVersionReduced => CompatibilityAspect.UsbVersion,
            _ => (CompatibilityAspect?)null
        };

        if (aspect is null || rated is null || executing is null)
            return [];

        return
        [
            new CompatibilityFact(aspect.Value, Text(executing), Text(rated))
        ];
    }

    private static string Text<T>(T value) =>
        value is IFormattable formattable
            ? formattable.ToString(null, CultureInfo.InvariantCulture) ?? ""
            : value?.ToString() ?? "";

    private sealed class Valueless : PartsCompatibilityResult
    {
        private Valueless(
            PartsCompatibility status,
            CompatibilityReason reason,
            IReadOnlyList<CompatibilityFact>? facts)
            : base(status, reason, facts)
        {
        }

        public static Valueless Create(
            PartsCompatibility status,
            CompatibilityReason reason,
            IReadOnlyList<CompatibilityFact>? facts)
        {
            return new Valueless(status, reason, facts);
        }
    }
}

/// <summary>
/// Compatible-with-reduced-performance only. Carries rated vs executing values.
/// </summary>
public sealed class PartsCompatibilityResult<T> : PartsCompatibilityResult
{
    internal PartsCompatibilityResult(
        CompatibilityReason reason,
        T rated,
        T executing,
        IReadOnlyList<CompatibilityFact>? facts = null)
        : base(PartsCompatibility.CompatibleReduced, reason, facts)
    {
        Rated = rated;
        Executing = executing;
    }

    /// <summary>Advertised / capable value of the constrained part.</summary>
    public T Rated { get; }

    /// <summary>Actual operating value under the other part's limit.</summary>
    public T Executing { get; }
}
