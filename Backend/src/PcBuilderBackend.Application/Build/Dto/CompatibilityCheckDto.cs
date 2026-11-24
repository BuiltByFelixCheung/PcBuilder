using PcBuilderBackend.Domain.Enums;
using PcBuilderBackend.Domain.ValueObjects;

namespace PcBuilderBackend.Application.Build.Dto;

public record CompatibilityCheckDto
{
    public PartsCompatibility Status { get; init; }
    public List<CompatibilityIssueDto> Issues { get; init; } = [];

    public static CompatibilityCheckDto From(IReadOnlyList<CompatibilityCheck> checks)
    {
        var issues = checks
            .Where(check => check.Result.Status != PartsCompatibility.Compatible)
            .Select(CompatibilityIssueDto.From)
            .ToList();

        return new CompatibilityCheckDto
        {
            Status = checks.Count == 0
                ? PartsCompatibility.Compatible
                : checks.Min(check => check.Result.Status),
            Issues = issues
        };
    }
}

public record CompatibilityIssueDto
{
    public PartsCompatibility Status { get; init; }
    public CompatibilityReason Reason { get; init; }
    public string? Rated { get; init; }
    public string? Executing { get; init; }
    public List<CompatibilityFactDto> Facts { get; init; } = [];
    public List<CompatibilityPartRefDto> Parts { get; init; } = [];

    public static CompatibilityIssueDto From(CompatibilityCheck check)
    {
        var (rated, executing) = Values(check.Result);
        return new CompatibilityIssueDto
        {
            Status = check.Result.Status,
            Reason = check.Result.Reason,
            Rated = rated,
            Executing = executing,
            Facts = [.. check.Result.Facts.Select(fact => new CompatibilityFactDto(fact.Aspect, fact.Limit, fact.Actual))],
            Parts = [.. check.Parts.Select(part => new CompatibilityPartRefDto(part.Slot, part.PartId, part.Name))]
        };
    }

    private static (string? Rated, string? Executing) Values(PartsCompatibilityResult result) =>
        result switch
        {
            PartsCompatibilityResult<int> speed => (speed.Rated.ToString(), speed.Executing.ToString()),
            PartsCompatibilityResult<PcieGeneration> pcie => (pcie.Rated.ToString(), pcie.Executing.ToString()),
            PartsCompatibilityResult<UsbVersion> usb => (usb.Rated.ToString(), usb.Executing.ToString()),
            _ => (null, null)
        };
}

public record CompatibilityFactDto(CompatibilityAspect Aspect, string? Limit, string? Actual);

public record CompatibilityPartRefDto(CompatibilitySlot Slot, Guid? PartId, string? Name = null);
