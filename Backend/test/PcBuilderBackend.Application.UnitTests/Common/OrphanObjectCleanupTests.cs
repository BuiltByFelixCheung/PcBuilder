using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using PcBuilderBackend.Application.Common.Interfaces;
using PcBuilderBackend.Application.Common.Storage;

namespace PcBuilderBackend.Application.UnitTests.Common;

public class OrphanObjectCleanupTests
{
    private readonly IStorageService _storage = Substitute.For<IStorageService>();

    [Fact]
    public async Task Remove_deletes_with_a_fresh_token()
    {
        await _storage.RemoveOrphanObject(
            NullLogger.Instance,
            "pc-builder/cpu.jpg",
            new InvalidOperationException("database"));

        await _storage.Received(1).DeleteAsync("pc-builder/cpu.jpg", CancellationToken.None);
    }

    [Fact]
    public async Task Remove_keeps_going_when_delete_fails()
    {
        _storage.DeleteAsync("pc-builder/cpu.jpg", CancellationToken.None)
            .ThrowsAsync(new IOException("storage"));

        var act = () => _storage.RemoveOrphanObject(
            NullLogger.Instance,
            "pc-builder/cpu.jpg",
            new InvalidOperationException("database"));

        await act.Should().NotThrowAsync();
    }
}
