using Microsoft.Extensions.Logging;
using PcBuilderBackend.Application.Common.Interfaces;
using PcBuilderBackend.Application.Common.Logging;

namespace PcBuilderBackend.Application.Common.Storage;

public static class OrphanObjectCleanup
{
    public static async Task RemoveOrphanObject(
        this IStorageService storage,
        ILogger logger,
        string key,
        Exception saveFailure)
    {
        try
        {
            // The request token is often already canceled. Cleanup still has to
            // delete the object that has no matching row.
            await storage.DeleteAsync(key, CancellationToken.None);
        }
        catch (Exception cleanupFailure)
        {
            EntityLog.PictureCleanupFailed(logger, cleanupFailure, key, saveFailure.Message);
        }
    }
}
