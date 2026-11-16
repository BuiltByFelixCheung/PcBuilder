namespace PcBuilderBackend.Application.Seo;

public interface ISpaPageSource
{
    Task<SpaResolutionResult> ResolveAsync(string? requestPath, CancellationToken cancellationToken);
}
