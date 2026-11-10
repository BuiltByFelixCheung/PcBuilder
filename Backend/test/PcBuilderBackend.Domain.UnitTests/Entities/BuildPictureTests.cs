using FluentAssertions;
using PcBuilderBackend.Domain.Entities;

namespace PcBuilderBackend.Domain.UnitTests.Entities;

public class BuildPictureTests
{
    [Fact]
    public void New_picture_keeps_the_build_and_storage_key()
    {
        var buildId = Guid.NewGuid();

        var picture = new BuildPicture(buildId, " pc-builder/build.jpg ");

        picture.Id.Should().NotBe(Guid.Empty);
        picture.IsActive.Should().BeTrue();
        picture.BuildId.Should().Be(buildId);
        picture.PictureKey.Should().Be("pc-builder/build.jpg");
    }

    [Fact]
    public void Deactivate_hides_the_row_and_keeps_the_storage_key()
    {
        var picture = new BuildPicture(Guid.NewGuid(), "pc-builder/build.png");

        picture.Deactivate();

        picture.IsActive.Should().BeFalse();
        picture.PictureKey.Should().Be("pc-builder/build.png");
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    public void Picture_key_is_required(string pictureKey)
    {
        var act = () => new BuildPicture(Guid.NewGuid(), pictureKey);

        act.Should().Throw<ArgumentException>().WithParameterName("pictureKey");
    }

    [Fact]
    public void Picture_key_must_fit()
    {
        var act = () => new BuildPicture(
            Guid.NewGuid(),
            new string('k', BuildPicture.PictureKeyMaxLength + 1));

        act.Should().Throw<ArgumentException>().WithParameterName("pictureKey");
    }

    [Fact]
    public void Build_id_is_required()
    {
        var act = () => new BuildPicture(Guid.Empty, "pc-builder/build.jpg");

        act.Should().Throw<ArgumentException>().WithParameterName("buildId");
    }
}
