using MediatR;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using PcBuilderBackend.Api.Extensions;
using PcBuilderBackend.Api.Filters;
using PcBuilderBackend.Application.Catalog.StorageDrives.Commands.BulkCreateStorageDrives;
using PcBuilderBackend.Application.Catalog.StorageDrives.Commands.BulkDeleteStorageDrives;
using PcBuilderBackend.Application.Catalog.StorageDrives.Commands.BulkUpdateStorageDrives;
using PcBuilderBackend.Application.Catalog.StorageDrives.Commands.CreateStorageDrive;
using PcBuilderBackend.Application.Catalog.StorageDrives.Commands.DeleteStorageDrive;
using PcBuilderBackend.Application.Catalog.StorageDrives.Commands.ImportStorageDrives;
using PcBuilderBackend.Application.Catalog.StorageDrives.Commands.UpdateStorageDrive;
using PcBuilderBackend.Application.Catalog.StorageDrives.Dto;
using PcBuilderBackend.Application.Catalog.StorageDrives.Queries;
using PcBuilderBackend.Application.Common.Dto;

namespace PcBuilderBackend.Api.Endpoints.Catalog;

public static class StorageDriveEndpoints
{
    public static void MapStorageDriveEndpoints(this RouteGroupBuilder group)
    {
        var subgroup = group.MapGroup("storage-drive")
            .WithSidebarGroup("Catalog", "Storage Drive")
            .WithDescription("Browse, Read, Edit, Add and Delete storage drives");

        subgroup.MapGet("/", GetStorageDrives)
            .Produces<PagedResult<StorageDriveDto>>()
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Browse storage drives")
            .WithDescription("\n    GET /catalog/storage-drive");
        subgroup.MapMethods("/", [HttpMethods.Query], QueryStorageDrives)
            .Produces<PagedResult<StorageDriveDto>>()
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Filter storage drives")
            .WithDescription("\n    QUERY /catalog/storage-drive");

        subgroup.MapGet("/{id:guid}", GetStorageDriveById)
            .Produces<StorageDriveDto>()
            .Produces(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Read storage drive by ID")
            .WithDescription("\n    GET /catalog/storage-drive/{id}");

        subgroup.MapPost("/", CreateStorageDrive)
            .Produces<StorageDriveDto>(StatusCodes.Status201Created)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Add a storage drive")
            .WithDescription("\n    POST /catalog/storage-drive");

        subgroup.MapPost("/bulk", BulkCreateStorageDrives)
            .Produces<List<StorageDriveDto>>(StatusCodes.Status201Created)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Add multiple storage drives")
            .WithDescription("\n    POST /catalog/storage-drive/bulk");

        subgroup.MapPut("/", UpdateStorageDrive)
            .Produces<StorageDriveDto>()
            .Produces(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Edit a storage drive")
            .WithDescription("\n    PUT /catalog/storage-drive");

        subgroup.MapPut("/bulk", BulkUpdateStorageDrives)
            .Produces<List<StorageDriveDto>>()
            .Produces(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Edit multiple storage drives")
            .WithDescription("\n    PUT /catalog/storage-drive/bulk");

        subgroup.MapDelete("/{id:guid}", DeleteStorageDrive)
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Delete a storage drive")
            .WithDescription("\n    DELETE /catalog/storage-drive/{id}");

        subgroup.MapDelete("/bulk", BulkDeleteStorageDrives)
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Delete multiple storage drives")
            .WithDescription("\n    DELETE /catalog/storage-drive/bulk");

        subgroup.MapPost("/import", ImportStorageDrives)
            .Produces<List<StorageDriveDto>>()
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .Accepts<IFormFile>("multipart/form-data")
            .DisableAntiforgery()
            .WithSummary("Import storage drives from Excel")
            .WithDescription("\n    POST /catalog/storage-drive/import");
    }

    private static async Task<Ok<PagedResult<StorageDriveDto>>> GetStorageDrives(
        [FromServices] ISender sender,
        [AsParameters] PagedRequest request,
        CancellationToken cancellationToken)
    {
        var query = new GetStorageDrivesQuery(request);
        return TypedResults.Ok(await sender.Send(query, cancellationToken));
    }

    private static async Task<Ok<PagedResult<StorageDriveDto>>> QueryStorageDrives(
        [FromServices] ISender sender,
        [FromBody] PagedRequest<StorageDriveFilter> request,
        CancellationToken cancellationToken)
    {
        var query = new FilterStorageDrivesQuery(request);
        return TypedResults.Ok(await sender.Send(query, cancellationToken));
    }

    private static async Task<Results<Ok<StorageDriveDto>, NotFound>> GetStorageDriveById(
        [FromRoute] Guid id,
        [FromServices] ISender sender,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetStorageDriveByIdQuery(id), cancellationToken);
        return result is null ? TypedResults.NotFound() : TypedResults.Ok(result);
    }

    private static async Task<Created<StorageDriveDto>> CreateStorageDrive(
        [Validate] [FromBody] CreateStorageDriveCommand command,
        [FromServices] ISender sender,
        HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(command, cancellationToken);
        return TypedResults.Created($"{httpContext.Request.Path}/{result.Id}", result);
    }

    private static async Task<Results<Ok<StorageDriveDto>, NotFound>> UpdateStorageDrive(
        [Validate] [FromBody] UpdateStorageDriveCommand command,
        [FromServices] ISender sender,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(command, cancellationToken);
        return result is null ? TypedResults.NotFound() : TypedResults.Ok(result);
    }

    private static async Task<Results<NoContent, NotFound>> DeleteStorageDrive(
        [FromRoute] Guid id,
        [FromServices] ISender sender,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new DeleteStorageDriveCommand(id), cancellationToken);
        return result ? TypedResults.NoContent() : TypedResults.NotFound();
    }

    private static async Task<Created<List<StorageDriveDto>>> BulkCreateStorageDrives(
        [Validate] [FromBody] BulkCreateStorageDrivesCommand command,
        [FromServices] ISender sender,
        HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(command, cancellationToken);
        return TypedResults.Created($"{httpContext.Request.Path}", result);
    }

    private static async Task<Results<Ok<List<StorageDriveDto>>, NotFound>> BulkUpdateStorageDrives(
        [Validate] [FromBody] BulkUpdateStorageDrivesCommand command,
        [FromServices] ISender sender,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(command, cancellationToken);
        return result is null || result.Count == 0 ? TypedResults.NotFound() : TypedResults.Ok(result);
    }

    private static async Task<Results<NoContent, NotFound>> BulkDeleteStorageDrives(
        [Validate] [FromBody] BulkDeleteStorageDrivesCommand command,
        [FromServices] ISender sender,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(command, cancellationToken);
        return result ? TypedResults.NoContent() : TypedResults.NotFound();
    }

    private static async Task<Ok<List<StorageDriveDto>>> ImportStorageDrives(
        IFormFile file,
        [FromServices] ISender sender,
        CancellationToken cancellationToken)
    {
        await using var fileStream = file.OpenReadStream();
        var result = await sender.Send(new ImportStorageDrivesCommand(fileStream), cancellationToken);
        return TypedResults.Ok(result);
    }
}
