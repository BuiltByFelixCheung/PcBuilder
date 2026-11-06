namespace PcBuilderBackend.Application.Common.Storage;

public sealed class StoredObject(Stream content, string contentType, IDisposable owner) : IDisposable
{
    public Stream Content { get; } = content;
    public string ContentType { get; } = contentType;

    public void Dispose() => owner.Dispose();
}
