using AutoMapper;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using PcBuilderBackend.Application.Build;
using PcBuilderBackend.Application.Build.Commands.DeleteBuildPicture;
using PcBuilderBackend.Application.Build.Commands.UploadBuildPicture;
using PcBuilderBackend.Application.Build.Dto;
using PcBuilderBackend.Application.Build.Queries;
using PcBuilderBackend.Application.Build.Validators;
using PcBuilderBackend.Application.Common.Interfaces;
using PcBuilderBackend.Application.Common.Storage;
using PcBuilderBackend.Domain.Entities;

namespace PcBuilderBackend.Application.UnitTests.Build;

public class BuildPictureHandlerTests
{
    private readonly IBuildPictureRepository _pictures = Substitute.For<IBuildPictureRepository>();
    private readonly IBuildPictureReadStore _store = Substitute.For<IBuildPictureReadStore>();
    private readonly IPcBuildReadStore _builds = Substitute.For<IPcBuildReadStore>();
    private readonly IStorageService _storage = Substitute.For<IStorageService>();
    private readonly IUnitOfWork _unitOfWork = Substitute.For<IUnitOfWork>();
    private readonly ICurrentUser _currentUser = Substitute.For<ICurrentUser>();
    private readonly IMapper _mapper = Substitute.For<IMapper>();
    private readonly Guid _ownerId = Guid.NewGuid();

    public BuildPictureHandlerTests()
    {
        _currentUser.UserId.Returns(_ownerId);
    }

    [Fact]
    public async Task Upload_saves_the_row_with_the_storage_key()
    {
        var buildId = Guid.NewGuid();
        Own(buildId);
        _storage.UploadAsync(
                Arg.Any<Stream>(),
                "build.jpg",
                "image/jpeg",
                Arg.Any<CancellationToken>())
            .Returns("pc-builder/build.jpg");
        _mapper.Map<BuildPictureDto>(Arg.Any<BuildPicture>())
            .Returns(call =>
            {
                var picture = call.Arg<BuildPicture>();
                return new BuildPictureDto(picture.Id, picture.BuildId);
            });

        await using var content = new MemoryStream([1, 2, 3]);
        var result = await UploadHandler().Handle(
            new UploadBuildPictureCommand(buildId, content, "build.jpg", "image/jpeg", content.Length),
            CancellationToken.None);

        result.BuildId.Should().Be(buildId);
        await _unitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
        _pictures.Received(1).Add(Arg.Is<BuildPicture>(picture =>
            picture.PictureKey == "pc-builder/build.jpg"
            && picture.BuildId == buildId
            && picture.IsActive));
    }

    [Fact]
    public async Task Upload_does_not_store_a_file_when_the_caller_does_not_own_the_build()
    {
        var buildId = Guid.NewGuid();
        _builds.GetByIdAsync(buildId, Arg.Any<CancellationToken>())
            .Returns(Build(buildId, Guid.NewGuid(), isPublic: true));

        await using var content = new MemoryStream([1]);
        var act = () => UploadHandler().Handle(
            new UploadBuildPictureCommand(buildId, content, "build.jpg", "image/jpeg", content.Length),
            CancellationToken.None);

        await act.Should().ThrowAsync<UnauthorizedAccessException>();
        await _storage.DidNotReceive().UploadAsync(
            Arg.Any<Stream>(),
            Arg.Any<string>(),
            Arg.Any<string>(),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Upload_hides_a_private_build_from_other_members()
    {
        var buildId = Guid.NewGuid();
        _builds.GetByIdAsync(buildId, Arg.Any<CancellationToken>())
            .Returns(Build(buildId, Guid.NewGuid(), isPublic: false));

        await using var content = new MemoryStream([1]);
        var act = () => UploadHandler().Handle(
            new UploadBuildPictureCommand(buildId, content, "build.jpg", "image/jpeg", content.Length),
            CancellationToken.None);

        await act.Should().ThrowAsync<KeyNotFoundException>()
            .WithMessage("Build was not found.");
        await _storage.DidNotReceive().UploadAsync(
            Arg.Any<Stream>(),
            Arg.Any<string>(),
            Arg.Any<string>(),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Upload_saves_a_picture_for_the_guest_who_created_the_build()
    {
        var buildId = Guid.NewGuid();
        var (token, hash) = BuildPictureEditToken.Create();
        _currentUser.UserId.Returns((Guid?)null);
        _builds.GetByIdAsync(buildId, Arg.Any<CancellationToken>())
            .Returns(GuestBuild(buildId));
        _builds.GetPictureEditTokenHashAsync(buildId, Arg.Any<CancellationToken>())
            .Returns(hash);
        _storage.UploadAsync(
                Arg.Any<Stream>(),
                "build.jpg",
                "image/jpeg",
                Arg.Any<CancellationToken>())
            .Returns("pc-builder/build.jpg");
        _mapper.Map<BuildPictureDto>(Arg.Any<BuildPicture>())
            .Returns(call =>
            {
                var picture = call.Arg<BuildPicture>();
                return new BuildPictureDto(picture.Id, picture.BuildId);
            });

        await using var content = new MemoryStream([1, 2, 3]);
        var result = await UploadHandler().Handle(
            new UploadBuildPictureCommand(
                buildId,
                content,
                "build.jpg",
                "image/jpeg",
                content.Length,
                token),
            CancellationToken.None);

        result.BuildId.Should().Be(buildId);
        _pictures.Received(1).Add(Arg.Is<BuildPicture>(picture => picture.BuildId == buildId));
    }

    [Fact]
    public async Task Upload_rejects_a_guest_token_that_does_not_match_the_build()
    {
        var buildId = Guid.NewGuid();
        var (_, hash) = BuildPictureEditToken.Create();
        var (otherToken, _) = BuildPictureEditToken.Create();
        _currentUser.UserId.Returns((Guid?)null);
        _builds.GetByIdAsync(buildId, Arg.Any<CancellationToken>())
            .Returns(GuestBuild(buildId));
        _builds.GetPictureEditTokenHashAsync(buildId, Arg.Any<CancellationToken>())
            .Returns(hash);

        await using var content = new MemoryStream([1]);
        var act = () => UploadHandler().Handle(
            new UploadBuildPictureCommand(
                buildId,
                content,
                "build.jpg",
                "image/jpeg",
                content.Length,
                otherToken),
            CancellationToken.None);

        await act.Should().ThrowAsync<UnauthorizedAccessException>();
        await _storage.DidNotReceive().UploadAsync(
            Arg.Any<Stream>(),
            Arg.Any<string>(),
            Arg.Any<string>(),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Upload_rejects_a_guest_token_on_a_member_build()
    {
        var buildId = Guid.NewGuid();
        var (token, _) = BuildPictureEditToken.Create();
        _currentUser.UserId.Returns((Guid?)null);
        _builds.GetByIdAsync(buildId, Arg.Any<CancellationToken>())
            .Returns(Build(buildId, Guid.NewGuid(), isPublic: true));

        await using var content = new MemoryStream([1]);
        var act = () => UploadHandler().Handle(
            new UploadBuildPictureCommand(
                buildId,
                content,
                "build.jpg",
                "image/jpeg",
                content.Length,
                token),
            CancellationToken.None);

        await act.Should().ThrowAsync<UnauthorizedAccessException>();
        await _builds.DidNotReceive().GetPictureEditTokenHashAsync(
            Arg.Any<Guid>(),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Upload_removes_the_object_when_the_row_cannot_be_saved()
    {
        var buildId = Guid.NewGuid();
        Own(buildId);
        _storage.UploadAsync(
                Arg.Any<Stream>(),
                "build.jpg",
                "image/jpeg",
                Arg.Any<CancellationToken>())
            .Returns("pc-builder/build.jpg");
        _unitOfWork.SaveChangesAsync(Arg.Any<CancellationToken>())
            .ThrowsAsync(new InvalidOperationException("database"));

        await using var content = new MemoryStream([1]);
        var act = () => UploadHandler().Handle(
            new UploadBuildPictureCommand(buildId, content, "build.jpg", "image/jpeg", content.Length),
            CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>();
        await _storage.Received(1).DeleteAsync("pc-builder/build.jpg", CancellationToken.None);
    }

    [Fact]
    public async Task Delete_removes_the_object_then_deactivates_the_row()
    {
        var picture = new BuildPicture(Guid.NewGuid(), "pc-builder/build.png");
        Own(picture.BuildId);
        _pictures.GetByIdAsync(picture.Id, Arg.Any<CancellationToken>()).Returns(picture);

        var deleted = await DeleteHandler().Handle(
            new DeleteBuildPictureCommand(picture.Id),
            CancellationToken.None);

        deleted.Should().BeTrue();
        picture.IsActive.Should().BeFalse();
        await _storage.Received(1).DeleteAsync("pc-builder/build.png", Arg.Any<CancellationToken>());
        await _unitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Delete_of_someone_elses_picture_does_not_touch_storage()
    {
        var picture = new BuildPicture(Guid.NewGuid(), "pc-builder/build.png");
        _pictures.GetByIdAsync(picture.Id, Arg.Any<CancellationToken>()).Returns(picture);
        _builds.GetByIdAsync(picture.BuildId, Arg.Any<CancellationToken>())
            .Returns(Build(picture.BuildId, Guid.NewGuid(), isPublic: true));

        var act = () => DeleteHandler().Handle(
            new DeleteBuildPictureCommand(picture.Id),
            CancellationToken.None);

        await act.Should().ThrowAsync<UnauthorizedAccessException>();
        picture.IsActive.Should().BeTrue();
        await _storage.DidNotReceive().DeleteAsync(Arg.Any<string>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Delete_hides_a_picture_on_a_private_build_from_other_members()
    {
        var picture = new BuildPicture(Guid.NewGuid(), "pc-builder/build.png");
        _pictures.GetByIdAsync(picture.Id, Arg.Any<CancellationToken>()).Returns(picture);
        _builds.GetByIdAsync(picture.BuildId, Arg.Any<CancellationToken>())
            .Returns(Build(picture.BuildId, Guid.NewGuid(), isPublic: false));

        var deleted = await DeleteHandler().Handle(
            new DeleteBuildPictureCommand(picture.Id),
            CancellationToken.None);

        deleted.Should().BeFalse();
        picture.IsActive.Should().BeTrue();
        await _storage.DidNotReceive().DeleteAsync(Arg.Any<string>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Delete_removes_a_guest_picture_when_the_token_matches()
    {
        var picture = new BuildPicture(Guid.NewGuid(), "pc-builder/guest.png");
        var (token, hash) = BuildPictureEditToken.Create();
        _currentUser.UserId.Returns((Guid?)null);
        _pictures.GetByIdAsync(picture.Id, Arg.Any<CancellationToken>()).Returns(picture);
        _builds.GetByIdAsync(picture.BuildId, Arg.Any<CancellationToken>())
            .Returns(GuestBuild(picture.BuildId));
        _builds.GetPictureEditTokenHashAsync(picture.BuildId, Arg.Any<CancellationToken>())
            .Returns(hash);

        var deleted = await DeleteHandler().Handle(
            new DeleteBuildPictureCommand(picture.Id, token),
            CancellationToken.None);

        deleted.Should().BeTrue();
        picture.IsActive.Should().BeFalse();
        await _storage.Received(1).DeleteAsync("pc-builder/guest.png", Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task List_returns_pictures_for_a_public_build()
    {
        var buildId = Guid.NewGuid();
        _currentUser.UserId.Returns((Guid?)null);
        _builds.GetByIdAsync(buildId, Arg.Any<CancellationToken>())
            .Returns(Build(buildId, Guid.NewGuid(), isPublic: true));
        var expected = new List<BuildPictureDto> { new(Guid.NewGuid(), buildId) };
        _store.ListByBuildAsync(buildId, Arg.Any<CancellationToken>()).Returns(expected);

        var result = await new ListBuildPicturesHandler(
                _builds,
                _store,
                _currentUser,
                NullLogger<ListBuildPicturesHandler>.Instance)
            .Handle(new ListBuildPicturesQuery(buildId), CancellationToken.None);

        result.Should().BeSameAs(expected);
    }

    [Fact]
    public async Task List_hides_a_private_build_from_other_members()
    {
        var buildId = Guid.NewGuid();
        _builds.GetByIdAsync(buildId, Arg.Any<CancellationToken>())
            .Returns(Build(buildId, Guid.NewGuid(), isPublic: false));

        var act = () => new ListBuildPicturesHandler(
                _builds,
                _store,
                _currentUser,
                NullLogger<ListBuildPicturesHandler>.Instance)
            .Handle(new ListBuildPicturesQuery(buildId), CancellationToken.None);

        await act.Should().ThrowAsync<UnauthorizedAccessException>();
        await _store.DidNotReceive().ListByBuildAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Content_opens_the_object_for_a_visible_build()
    {
        var picture = new BuildPicture(Guid.NewGuid(), "pc-builder/build.gif");
        _builds.GetByIdAsync(picture.BuildId, Arg.Any<CancellationToken>())
            .Returns(Build(picture.BuildId, _ownerId, isPublic: false));
        await using var stream = new MemoryStream([9]);
        var stored = new StoredObject(stream, "image/gif", stream);
        _pictures.GetByIdAsync(picture.Id, Arg.Any<CancellationToken>()).Returns(picture);
        _storage.OpenAsync(picture.PictureKey, Arg.Any<CancellationToken>()).Returns(stored);

        var result = await ContentHandler().Handle(
            new GetBuildPictureContentQuery(picture.Id),
            CancellationToken.None);

        result.Should().BeSameAs(stored);
    }

    [Fact]
    public async Task Content_of_a_private_build_is_hidden_from_other_members()
    {
        var picture = new BuildPicture(Guid.NewGuid(), "pc-builder/build.gif");
        _pictures.GetByIdAsync(picture.Id, Arg.Any<CancellationToken>()).Returns(picture);
        _builds.GetByIdAsync(picture.BuildId, Arg.Any<CancellationToken>())
            .Returns(Build(picture.BuildId, Guid.NewGuid(), isPublic: false));

        var act = () => ContentHandler().Handle(
            new GetBuildPictureContentQuery(picture.Id),
            CancellationToken.None);

        await act.Should().ThrowAsync<UnauthorizedAccessException>();
        await _storage.DidNotReceive().OpenAsync(Arg.Any<string>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Removing_pictures_for_a_deleted_build_deletes_the_objects()
    {
        var picture = new BuildPicture(Guid.NewGuid(), "pc-builder/build.jpg");
        _pictures.ListByBuildIdsAsync(Arg.Any<IEnumerable<Guid>>(), Arg.Any<CancellationToken>())
            .Returns([picture]);

        await BuildPictureStorage.RemoveForBuildsAsync(
            _pictures,
            _storage,
            [picture.BuildId],
            CancellationToken.None);

        picture.IsActive.Should().BeFalse();
        await _storage.Received(1).DeleteAsync("pc-builder/build.jpg", CancellationToken.None);
    }

    private UploadBuildPictureHandler UploadHandler() =>
        new(
            _pictures,
            _builds,
            _storage,
            _unitOfWork,
            _mapper,
            _currentUser,
            NullLogger<UploadBuildPictureHandler>.Instance);

    private DeleteBuildPictureHandler DeleteHandler() =>
        new(
            _pictures,
            _builds,
            _storage,
            _unitOfWork,
            _currentUser,
            NullLogger<DeleteBuildPictureHandler>.Instance);

    private GetBuildPictureContentHandler ContentHandler() =>
        new(
            _pictures,
            _builds,
            _storage,
            _currentUser,
            NullLogger<GetBuildPictureContentHandler>.Instance);

    private void Own(Guid buildId) =>
        _builds.GetByIdAsync(buildId, Arg.Any<CancellationToken>())
            .Returns(Build(buildId, _ownerId, isPublic: false));

    private static PcBuildDto Build(Guid id, Guid? ownerId, bool isPublic) =>
        new()
        {
            Id = id,
            Name = "Build",
            UserId = ownerId,
            IsPublic = isPublic
        };

    private static PcBuildDto GuestBuild(Guid id) => Build(id, null, isPublic: false);
}

public class BuildPictureValidatorTests
{
    [Fact]
    public async Task Upload_accepts_an_image()
    {
        await using var content = new MemoryStream([1, 2]);

        var result = await new UploadBuildPictureCommandValidator().ValidateAsync(
            new UploadBuildPictureCommand(
                Guid.NewGuid(),
                content,
                "build.jpg",
                "image/jpeg",
                content.Length));

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public async Task Upload_rejects_an_empty_file_and_a_missing_build()
    {
        await using var content = new MemoryStream();

        var result = await new UploadBuildPictureCommandValidator().ValidateAsync(
            new UploadBuildPictureCommand(Guid.Empty, content, "", "", 0));

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(error =>
            error.PropertyName == nameof(UploadBuildPictureCommand.BuildId));
        result.Errors.Should().Contain(error =>
            error.PropertyName == nameof(UploadBuildPictureCommand.Length));
    }
}
