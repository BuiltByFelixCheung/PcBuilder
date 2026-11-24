using System.Globalization;
using PcBuilderBackend.Domain.Entities;
using PcBuilderBackend.Domain.Enums;

namespace PcBuilderBackend.Domain.ValueObjects;

/// <summary>
/// One compared pair. <see cref="Limit"/> is the constraint.
/// <see cref="Actual"/> is the part or the demand being checked.
/// </summary>
public sealed record CompatibilityFact(CompatibilityAspect Aspect, string? Limit, string? Actual)
{
    public static string Number(decimal value) =>
        value.ToString("0.##", CultureInfo.InvariantCulture);

    public static string Number(int value) =>
        value.ToString(CultureInfo.InvariantCulture);

    public static string Token(Enum value) => value.ToString();

    public static string Tokens<T>(IEnumerable<T> values) where T : Enum =>
        string.Join(',', values.Select(value => value.ToString()).Distinct());

    public static string NameOrId(NamedEntity? entity, Guid id) =>
        entity is not null && !string.IsNullOrWhiteSpace(entity.Name)
            ? entity.Name
            : id.ToString();

    public static string Watts(decimal value) =>
        decimal.Round(value, 0, MidpointRounding.AwayFromZero)
            .ToString(CultureInfo.InvariantCulture);
}
