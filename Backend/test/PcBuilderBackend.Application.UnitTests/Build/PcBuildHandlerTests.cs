using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;
using PcBuilderBackend.Application.Auth.Dto;
using PcBuilderBackend.Application.Build;
using PcBuilderBackend.Application.Build.Commands.CreatePcBuild;
using PcBuilderBackend.Application.Build.Dto;
using PcBuilderBackend.Application.Build.Queries;
using PcBuilderBackend.Application.Common.Authorization;
using PcBuilderBackend.Application.Common.Dto;
using PcBuilderBackend.Application.Common.Interfaces;
using PcBuilderBackend.Application.UnitTests.Support;
using PcBuilderBackend.Domain.Entities;

namespace PcBuilderBackend.Application.UnitTests.Build;

public class PcBuildHandlerTests : IDisposable
{
    private readonly AppFixture _fx = new();

    public void Dispose()
    {
        Dispose(true);
        GC.SuppressFinalize(this);
    }

    protected virtual void Dispose(bool disposing)
    {
        if (disposing)
            _fx.Dispose();
    }

    [Fact]
    public async Task Anonymous_create_persists()
    {
        var pcBuilds = Substitute.For<IPcBuildRepository>();
        var unitOfWork = Substitute.For<IUnitOfWork>();
        var currentUser = Substitute.For<ICurrentUser>();
        currentUser.IsAuthenticated.Returns(false);

        var handler = new CreatePcBuildHandler(
            pcBuilds,
            CompatibleChecker(),
            NullLogger<CreatePcBuildHandler>.Instance,
            currentUser,
            unitOfWork,
            _fx.Mapper);

        var created = await handler.Handle(ValidCreate(), CancellationToken.None);

        created.Should().NotBeNull();
        pcBuilds.Received(1).Add(Arg.Any<PcBuild>());
        pcBuilds.DidNotReceive().AddUser(Arg.Any<PcBuildUser>());
        await unitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Member_create_publishes()
    {
        var userId = Guid.NewGuid();
        var pcBuilds = Substitute.For<IPcBuildRepository>();
        var unitOfWork = Substitute.For<IUnitOfWork>();
        var currentUser = Substitute.For<ICurrentUser>();
        currentUser.IsAuthenticated.Returns(true);
        currentUser.IsInRole(AuthRoles.Member).Returns(true);
        currentUser.UserId.Returns(userId);

        var handler = new CreatePcBuildHandler(
            pcBuilds,
            CompatibleChecker(),
            NullLogger<CreatePcBuildHandler>.Instance,
            currentUser,
            unitOfWork,
            _fx.Mapper);

        await handler.Handle(ValidCreate() with { IsPublic = true }, CancellationToken.None);

        pcBuilds.Received(1).AddUser(Arg.Is<PcBuildUser>(u => u.UserId == userId && u.IsPublic));
        await unitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Member_create_can_stay_private()
    {
        var userId = Guid.NewGuid();
        var pcBuilds = Substitute.For<IPcBuildRepository>();
        var unitOfWork = Substitute.For<IUnitOfWork>();
        var currentUser = Substitute.For<ICurrentUser>();
        currentUser.IsAuthenticated.Returns(true);
        currentUser.IsInRole(AuthRoles.Member).Returns(true);
        currentUser.UserId.Returns(userId);

        var handler = new CreatePcBuildHandler(
            pcBuilds,
            CompatibleChecker(),
            NullLogger<CreatePcBuildHandler>.Instance,
            currentUser,
            unitOfWork,
            _fx.Mapper);

        await handler.Handle(ValidCreate() with { IsPublic = false }, CancellationToken.None);

        pcBuilds.Received(1).AddUser(Arg.Is<PcBuildUser>(u => u.UserId == userId && !u.IsPublic));
    }

    [Fact]
    public async Task Admin_create_is_forbidden()
    {
        var pcBuilds = Substitute.For<IPcBuildRepository>();
        var unitOfWork = Substitute.For<IUnitOfWork>();
        var currentUser = Substitute.For<ICurrentUser>();
        currentUser.IsAuthenticated.Returns(true);
        currentUser.IsInRole(AuthRoles.Admin).Returns(true);
        currentUser.IsInRole(AuthRoles.Member).Returns(false);

        var handler = new CreatePcBuildHandler(
            pcBuilds,
            CompatibleChecker(),
            NullLogger<CreatePcBuildHandler>.Instance,
            currentUser,
            unitOfWork,
            _fx.Mapper);

        var act = () => handler.Handle(ValidCreate(), CancellationToken.None);

        await act.Should().ThrowAsync<UnauthorizedAccessException>();
        await unitOfWork.DidNotReceive().SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Get_by_id_forbids_private_build_of_another_user()
    {
        var id = Guid.NewGuid();
        var ownerId = Guid.NewGuid();
        var store = Substitute.For<IPcBuildReadStore>();
        store.GetByIdAsync(id, Arg.Any<CancellationToken>()).Returns(new PcBuildDto
        {
            Id = id,
            Name = "Hidden",
            UserId = ownerId,
            IsPublic = false
        });
        var currentUser = Substitute.For<ICurrentUser>();
        currentUser.UserId.Returns(Guid.NewGuid());
        var identity = Substitute.For<IIdentityService>();

        var act = () => new GetPcBuildByIdHandler(store, currentUser, identity)
            .Handle(new GetPcBuildByIdQuery(id), CancellationToken.None);

        await act.Should().ThrowAsync<UnauthorizedAccessException>();
    }

    [Fact]
    public async Task Get_by_id_allows_public_build()
    {
        var id = Guid.NewGuid();
        var ownerId = Guid.NewGuid();
        var dto = new PcBuildDto
        {
            Id = id,
            Name = "Public",
            UserId = ownerId,
            IsPublic = true
        };
        var store = Substitute.For<IPcBuildReadStore>();
        store.GetByIdAsync(id, Arg.Any<CancellationToken>()).Returns(dto);
        var currentUser = Substitute.For<ICurrentUser>();
        currentUser.UserId.Returns(Guid.NewGuid());
        var identity = Substitute.For<IIdentityService>();
        identity.GetUserAsync(ownerId, Arg.Any<CancellationToken>())
            .Returns(new CurrentUserDto(ownerId, "a@b.c", "annbuilder", ["Member"]));

        var result = await new GetPcBuildByIdHandler(store, currentUser, identity)
            .Handle(new GetPcBuildByIdQuery(id), CancellationToken.None);

        result.Should().NotBeNull();
        result!.Id.Should().Be(id);
        result.UserName.Should().Be("annbuilder");
    }

    [Fact]
    public async Task List_public_sets_user_name_from_identity()
    {
        var userId = Guid.NewGuid();
        var store = Substitute.For<IPcBuildReadStore>();
        store.ListPublicAsync(Arg.Any<PagedRequest>(), Arg.Any<CancellationToken>())
            .Returns(new PagedResult<PcBuildListItemDto>
            {
                Items =
                [
                    new PcBuildListItemDto
                    {
                        Id = Guid.NewGuid(),
                        Name = "Office",
                        UserId = userId,
                        IsPublic = true
                    }
                ]
            });
        var identity = Substitute.For<IIdentityService>();
        identity.GetUserAsync(userId, Arg.Any<CancellationToken>())
            .Returns(new CurrentUserDto(userId, "a@b.c", "annbuilder", ["Member"]));

        var result = await new ListPublicPcBuildsHandler(store, identity)
            .Handle(new ListPublicPcBuildsQuery(new PagedRequest()), CancellationToken.None);

        result.Items.Should().ContainSingle(item => item.UserName == "annbuilder");
    }

    private static ICompatibilityChecker CompatibleChecker()
    {
        var checker = Substitute.For<ICompatibilityChecker>();
        checker.CheckCompatibilityAsync(Arg.Any<CompatibilityCheckRequest>())
            .Returns([]);
        return checker;
    }

    private static CreatePcBuildCommand ValidCreate() =>
        new(
            "My build",
            null,
            false,
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            null,
            Guid.NewGuid(),
            null,
            Guid.NewGuid(),
            [],
            [],
            [],
            []);
}
