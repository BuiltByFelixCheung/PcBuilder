using MediatR;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using PcBuilderBackend.Api.Extensions;
using PcBuilderBackend.Application.Catalog.ProductPictures.Commands.DeleteProductPicture;
using PcBuilderBackend.Application.Catalog.ProductPictures.Commands.UploadProductPicture;
using PcBuilderBackend.Application.Catalog.ProductPictures.Dto;
using PcBuilderBackend.Application.Catalog.ProductPictures.Queries;
using PcBuilderBackend.Application.Common.Storage;
using PcBuilderBackend.Domain.Enums;

namespace PcBuilderBackend.Api.Endpoints.Catalog;

public static class ProductPictureEndpoints
{
    public static void MapProductPictureEndpoints(this RouteGroupBuilder group)
    {
        var subgroup = group.MapGroup("pictures")
            .WithSidebarGroup("Catalog", "Pictures")
            .WithDescription("Browse product pictures. Uploading a picture requires Admin or an Importer API key. Deleting a picture requires Admin.");

        subgroup.MapGet("/", ListPictures)
            .Produces<List<ProductPictureDto>>()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("List pictures for a product")
            .WithDescription(
                "\n    GET /api/catalog/pictures?productType=Cpu&productId=00000000-0000-0000-0000-000000000000");

        subgroup.MapGet("/{id}/content", GetPictureContent)
            .Produces(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Read picture content")
            .WithDescription("\n    GET /api/catalog/pictures/00000000-0000-0000-0000-000000000000/content");

        subgroup.MapPost("/", UploadPicture)
            .Accepts<IFormFile>("multipart/form-data")
            .DisableAntiforgery()
            .Produces<ProductPictureDto>(StatusCodes.Status201Created)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Upload a product picture")
            .WithDescription(
                "\n    POST /api/catalog/pictures" +
                "\n    Multipart form: productType, productId, and file." +
                "\n    Requires the Admin role or an Importer API key.");

        subgroup.MapDelete("/{id}", DeletePicture)
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Delete a product picture")
            .WithDescription(
                "\n    DELETE /api/catalog/pictures/00000000-0000-0000-0000-000000000000" +
                "\n    Deactivates the picture row and removes the stored object." +
                "\n    Requires the Admin role.");
    }

    private static async Task<Ok<List<ProductPictureDto>>> ListPictures(
        [FromQuery] ProductType productType,
        [FromQuery] Guid productId,
        [FromServices] ISender sender,
        CancellationToken cancellationToken)
    {
        var pictures = await sender.Send(new ListProductPicturesQuery(productType, productId), cancellationToken);
        return TypedResults.Ok(pictures);
    }

    private static async Task<Results<ProductPictureContentResult, NotFound>> GetPictureContent(
        [FromRoute] Guid id,
        [FromServices] ISender sender,
        CancellationToken cancellationToken)
    {
        var content = await sender.Send(new GetProductPictureContentQuery(id), cancellationToken);
        return content is null
            ? TypedResults.NotFound()
            : new ProductPictureContentResult(content);
    }

    private static async Task<Created<ProductPictureDto>> UploadPicture(
        IFormFile? file,
        [FromForm] string? productType,
        [FromForm] Guid productId,
        [FromServices] ISender sender,
        HttpContext context,
        CancellationToken cancellationToken)
    {
        var parsedType = Enum.TryParse<ProductType>(productType, ignoreCase: true, out var value) && Enum.IsDefined(value)
            ? value
            : (ProductType)(-1);

        await using var stream = file?.OpenReadStream() ?? Stream.Null;
        var command = new UploadProductPictureCommand(
            parsedType,
            productId,
            stream,
            file?.FileName ?? string.Empty,
            file?.ContentType ?? string.Empty,
            file?.Length ?? 0);
        var result = await sender.Send(command, cancellationToken);
        return TypedResults.Created($"{context.Request.Path}/{result.Id}", result);
    }

    private static async Task<Results<NoContent, NotFound>> DeletePicture(
        [FromRoute] Guid id,
        [FromServices] ISender sender,
        CancellationToken cancellationToken)
    {
        var deleted = await sender.Send(new DeleteProductPictureCommand(id), cancellationToken);
        return deleted ? TypedResults.NoContent() : TypedResults.NotFound();
    }

    private sealed class ProductPictureContentResult(StoredObject file) : IResult
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
