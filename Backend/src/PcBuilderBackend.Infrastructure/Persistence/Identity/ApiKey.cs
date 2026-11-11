namespace PcBuilderBackend.Infrastructure.Persistence.Identity;

public class ApiKey
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public string TokenHash { get; set; } = null!;
    public string Prefix { get; set; } = null!;
    public DateTime? ExpiresAtUtc { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? RevokedAtUtc { get; set; }
    public Guid CreatedByUserId { get; set; }
    public ApplicationUser CreatedByUser { get; set; } = null!;
}
