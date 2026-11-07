using Microsoft.Extensions.Logging;

namespace PcBuilderBackend.Infrastructure.Services;

internal static partial class StorageLog
{
    [LoggerMessage(
        EventId = 4001,
        Level = LogLevel.Debug,
        Message = "Object {ObjectKey} was already absent from storage.")]
    public static partial void ObjectAlreadyAbsent(ILogger logger, string objectKey);
}
