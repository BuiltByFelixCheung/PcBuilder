using PcBuilderBackend.Application.Common.Storage;

namespace PcBuilderBackend.Application.Common.Interfaces;

public interface IStorageService
{
    Task<string> UploadAsync(
        Stream fileStream,
        string fileName,
        string contentType,
        CancellationToken cancellationToken = default);

    Task DeleteAsync(string key, CancellationToken cancellationToken = default);

    Task<StoredObject?> OpenAsync(string key, CancellationToken cancellationToken = default);
}

