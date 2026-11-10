namespace PcBuilderBackend.Domain.Entities;

public class BuildPicture : BaseEntity
{
    public const int PictureKeyMaxLength = 512;

    public Guid BuildId { get; private set; }
    public string PictureKey { get; private set; } = null!;

    protected BuildPicture()
    {
    }

    public BuildPicture(Guid buildId, string pictureKey)
    {
        SetBuildPicture(buildId, pictureKey);
    }

    private void SetBuildPicture(Guid buildId, string pictureKey)
    {
        if (buildId == Guid.Empty)
            throw new ArgumentException("Build id cannot be empty.", nameof(buildId));

        if (string.IsNullOrWhiteSpace(pictureKey))
            throw new ArgumentException("Picture key is required.", nameof(pictureKey));

        var key = pictureKey.Trim();
        if (key.Length > PictureKeyMaxLength)
            throw new ArgumentException(
                $"Picture key must be {PictureKeyMaxLength} characters or fewer.",
                nameof(pictureKey));

        BuildId = buildId;
        PictureKey = key;
    }
}