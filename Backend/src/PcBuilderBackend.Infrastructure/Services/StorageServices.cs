using System.Net;
using Amazon.S3;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using PcBuilderBackend.Application.Common.Interfaces;
using PcBuilderBackend.Application.Common.Storage;

namespace PcBuilderBackend.Infrastructure.Services;

public class StorageService : IStorageService
{
    private readonly string _bucketName;
    private readonly AmazonS3Client _s3Client;
    private readonly ILogger<StorageService> _logger;

    public StorageService(IConfiguration configuration, ILogger<StorageService> logger)
    {
        _logger = logger;
        _bucketName = configuration["S3:BucketName"] ?? "";
        var accessKey = configuration["S3:AccessKey"] ?? "";
        var secretKey = configuration["S3:SecretKey"] ?? "";
        var serviceUrl = configuration["S3:ServiceUrl"] ?? "";
        _s3Client = new AmazonS3Client(accessKey, secretKey, new AmazonS3Config
        {
            ServiceURL = serviceUrl,
            ForcePathStyle = true
        });
    }

    public async Task<string> UploadAsync(
        Stream fileStream,
        string fileName,
        string contentType,
        CancellationToken cancellationToken = default)
    {
        var key = $"pc-builder/{Guid.NewGuid()}{Path.GetExtension(fileName)}";

        var request = new Amazon.S3.Model.PutObjectRequest
        {
            BucketName = _bucketName,
            Key = key,
            InputStream = fileStream,
            ContentType = contentType
        };

        await _s3Client.PutObjectAsync(request, cancellationToken);
        return key;
    }

    public async Task DeleteAsync(string key, CancellationToken cancellationToken = default)
    {
        try
        {
            await _s3Client.DeleteObjectAsync(new Amazon.S3.Model.DeleteObjectRequest
            {
                BucketName = _bucketName,
                Key = key
            }, cancellationToken);
        }
        catch (AmazonS3Exception exception) when (IsMissingObject(exception))
        {
            StorageLog.ObjectAlreadyAbsent(_logger, key);
        }
    }

    public async Task<StoredObject?> OpenAsync(string key, CancellationToken cancellationToken = default)
    {
        try
        {
            var response = await _s3Client.GetObjectAsync(new Amazon.S3.Model.GetObjectRequest
            {
                BucketName = _bucketName,
                Key = key
            }, cancellationToken);

            var contentType = string.IsNullOrWhiteSpace(response.Headers.ContentType)
                ? "application/octet-stream"
                : response.Headers.ContentType;
            return new StoredObject(response.ResponseStream, contentType, response);
        }
        catch (AmazonS3Exception exception) when (IsMissingObject(exception))
        {
            return null;
        }
    }

    private static bool IsMissingObject(AmazonS3Exception exception) =>
        exception.StatusCode == HttpStatusCode.NotFound
        || exception.ErrorCode is "NoSuchKey" or "NotFound";
}
