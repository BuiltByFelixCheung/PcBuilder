using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using PcBuilderBackend.Infrastructure.Identity;
using PcBuilderBackend.Infrastructure.Persistence.Identity;

namespace PcBuilderBackend.Infrastructure.UnitTests.Identity;

public class ApiKeyServiceTests
{
    [Fact]
    public async Task Create_stores_the_hash_and_authenticates_only_the_raw_key()
    {
        await using var db = CreateDb();
        var service = new ApiKeyService(db, NullLogger<ApiKeyService>.Instance);
        var userId = Guid.NewGuid();

        var issued = await service.CreateAsync(userId, " import-agent ", null, CancellationToken.None);

        issued.Key.Should().StartWith(ApiKeyToken.Prefix);
        issued.Prefix.Should().Be(ApiKeyToken.DisplayPrefix(issued.Key));
        issued.Name.Should().Be("import-agent");
        issued.CreatedByUserId.Should().Be(userId);

        var stored = await db.ApiKeys.SingleAsync();
        stored.TokenHash.Should().Be(ApiKeyToken.Hash(issued.Key));
        stored.TokenHash.Should().NotBe(issued.Key);
        stored.TokenHash.Should().HaveLength(64);

        var match = await service.AuthenticateAsync(issued.Key, CancellationToken.None);
        match.Should().NotBeNull();
        match!.ApiKeyId.Should().Be(issued.Id);
        match.CreatedByUserId.Should().Be(userId);

        (await service.AuthenticateAsync(issued.Key + "x", CancellationToken.None)).Should().BeNull();
        (await service.AuthenticateAsync("not-a-key", CancellationToken.None)).Should().BeNull();
    }

    [Fact]
    public async Task Authenticate_rejects_expired_and_revoked_keys()
    {
        await using var db = CreateDb();
        var service = new ApiKeyService(db, NullLogger<ApiKeyService>.Instance);
        var userId = Guid.NewGuid();

        var expired = await service.CreateAsync(
            userId,
            "expired",
            DateTime.UtcNow.AddMinutes(-5),
            CancellationToken.None);
        (await service.AuthenticateAsync(expired.Key, CancellationToken.None)).Should().BeNull();

        var active = await service.CreateAsync(
            userId,
            "active",
            DateTime.UtcNow.AddHours(1),
            CancellationToken.None);
        (await service.AuthenticateAsync(active.Key, CancellationToken.None)).Should().NotBeNull();

        (await service.RevokeAsync(active.Id, CancellationToken.None)).Should().BeTrue();
        (await service.AuthenticateAsync(active.Key, CancellationToken.None)).Should().BeNull();
        (await service.RevokeAsync(active.Id, CancellationToken.None)).Should().BeTrue();
        (await service.RevokeAsync(Guid.NewGuid(), CancellationToken.None)).Should().BeFalse();

        var listed = await service.ListAsync(CancellationToken.None);
        listed.Select(key => key.Id).Should().BeEquivalentTo([active.Id, expired.Id]);
        listed.Single(key => key.Id == active.Id).RevokedAtUtc.Should().NotBeNull();
        listed.Should().OnlyContain(key => key.Prefix.StartsWith(ApiKeyToken.Prefix));
    }

    private static ApplicationIdentityDbContext CreateDb()
    {
        var options = new DbContextOptionsBuilder<ApplicationIdentityDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        var db = new ApplicationIdentityDbContext(options);
        db.Database.EnsureCreated();
        return db;
    }
}
