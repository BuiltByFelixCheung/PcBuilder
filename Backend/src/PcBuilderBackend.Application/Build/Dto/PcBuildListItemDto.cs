namespace PcBuilderBackend.Application.Build.Dto;

public record PcBuildListItemDto
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string? Description { get; init; }
    public Guid? UserId { get; init; }
    public string? UserName { get; init; }
    public bool IsPublic { get; init; }
}

