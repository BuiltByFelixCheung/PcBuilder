using MediatR;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using PcBuilderBackend.Application.Build.Commands.DeleteBuildPicture;
using PcBuilderBackend.Application.Build.Commands.UploadBuildPicture;
using PcBuilderBackend.Application.Build.Dto;
using PcBuilderBackend.Application.Build.Queries;
using PcBuilderBackend.Application.Common.Storage;

namespace PcBuilderBackend.Api.Endpoints.Build;

public static class BuildPictureEndpoints
{
    public static void MapBuildPictureEndpoints(this RouteGroupBuilder group)
    {
        group.MapGet("/{buildId:guid}/pictures", ListPictures)
            .AllowAnonymous()
            .Produces<List<BuildPictureDto>>()
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("List pictures for a PC build")
            .WithDescription(
                "\n    GET /api/builds/00000000-0000-0000-0000-000000000000/pictures" +
                "\n    Private builds are visible only to their owner.");

        group.MapGet("/pictures/{id:guid}/content", GetPictureContent)
            .AllowAnonymous()
            .Produces(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Read a PC build picture")
            .WithDescription(
                "\n    GET /api/builds/pictures/00000000-0000-0000-0000-000000000000/content" +
                "\n    Private builds are visible only to their owner.");

        group.MapPost("/{buildId:guid}/pictures", UploadPicture)
            .AllowAnonymous()
            .AddEndpointFilter(ChallengeRejectedBearer)
            .Accepts<IFormFile>("multipart/form-data")
            .DisableAntiforgery()
            .Produces<BuildPictureDto>(StatusCodes.Status201Created)
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Upload a PC build picture")
            .WithDescription(
                "\n    POST /api/builds/00000000-0000-0000-0000-000000000000/pictures" +
                "\n    Multipart form: file." +
                "\n    The member who owns the build may upload." +
                "\n    A guest who created the build sends X-PcBuild-Picture-Token.");

        group.MapDelete("/pictures/{id:guid}", DeletePicture)
            .AllowAnonymous()
            .AddEndpointFilter(ChallengeRejectedBearer)
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Delete a PC build picture")
            .WithDescription(
                "\n    DELETE /api/builds/pictures/00000000-0000-0000-0000-000000000000" +
                "\n    Deactivates the picture row and removes the stored object." +
                "\n    The member who owns the build may delete." +
                "\n    A guest who created the build sends X-PcBuild-Picture-Token.");
    }

    private static async Task<Ok<List<BuildPictureDto>>> ListPictures(
        [FromRoute] Guid buildId,
        [FromServices] ISender sender,
        CancellationToken cancellationToken)
    {
        var pictures = await sender.Send(new ListBuildPicturesQuery(buildId), cancellationToken);
        return TypedResults.Ok(pictures);
    }

    private static async Task<Results<BuildPictureContentResult, NotFound>> GetPictureContent(
        [FromRoute] Guid id,
        [FromServices] ISender sender,
        CancellationToken cancellationToken)
    {
        var content = await sender.Send(new GetBuildPictureContentQuery(id), cancellationToken);
        return content is null
            ? TypedResults.NotFound()
            : new BuildPictureContentResult(content);
    }

    private static async Task<Created<BuildPictureDto>> UploadPicture(
        [FromRoute] Guid buildId,
        IFormFile? file,
        [FromServices] ISender sender,
        HttpContext context,
        CancellationToken cancellationToken)
    {
        await using var stream = file?.OpenReadStream() ?? Stream.Null;
        var command = new UploadBuildPictureCommand(
            buildId,
            stream,
            file?.FileName ?? string.Empty,
            file?.ContentType ?? string.Empty,
            file?.Length ?? 0,
            PictureEditToken(context));
        var result = await sender.Send(command, cancellationToken);
        return TypedResults.Created($"{context.Request.Path}/{result.Id}", result);
    }

    private static async Task<Results<NoContent, NotFound>> DeletePicture(
        [FromRoute] Guid id,
        [FromServices] ISender sender,
        HttpContext context,
        CancellationToken cancellationToken)
    {
        var deleted = await sender.Send(
            new DeleteBuildPictureCommand(id, PictureEditToken(context)),
            cancellationToken);
        return deleted ? TypedResults.NoContent() : TypedResults.NotFound();
    }

    private static async ValueTask<object?> ChallengeRejectedBearer(
        EndpointFilterInvocationContext context,
        EndpointFilterDelegate next)
    {
        var http = context.HttpContext;
        if (http.User.Identity?.IsAuthenticated != true && BearerTokenWasSent(http.Request))
            return TypedResults.Challenge();

        return await next(context);
    }

    private static bool BearerTokenWasSent(HttpRequest request)
    {
        var authorization = request.Headers.Authorization.ToString();
        const string prefix = "Bearer ";
        return authorization.StartsWith(prefix, StringComparison.OrdinalIgnoreCase)
               && !string.IsNullOrWhiteSpace(authorization[prefix.Length..]);
    }

    private static string? PictureEditToken(HttpContext context) =>
        context.Request.Headers["X-PcBuild-Picture-Token"].FirstOrDefault();

    private sealed class BuildPictureContentResult(StoredObject file) : IResult
    {
        public async Task ExecuteAsync(HttpContext httpContext)
        {
            using (file)
            {
                httpContext.Response.StatusCode = StatusCodes.Status200OK;
                httpContext.Response.ContentType = file.ContentType;
                await file.Content.CopyToAsync(httpContext.Response.Body, httpContext.RequestAborted);
            }
        }
    }
}
