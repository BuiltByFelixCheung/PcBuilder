using MediatR;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using PcBuilderBackend.Api.Extensions;
using PcBuilderBackend.Api.Filters;
using PcBuilderBackend.Application.Catalog.WiredNetworkAdapters.Commands.BulkCreateWiredNetworkAdapters;
using PcBuilderBackend.Application.Catalog.WiredNetworkAdapters.Commands.BulkDeleteWiredNetworkAdapters;
using PcBuilderBackend.Application.Catalog.WiredNetworkAdapters.Commands.BulkUpdateWiredNetworkAdapters;
using PcBuilderBackend.Application.Catalog.WiredNetworkAdapters.Commands.CreateWiredNetworkAdapter;
using PcBuilderBackend.Application.Catalog.WiredNetworkAdapters.Commands.DeleteWiredNetworkAdapter;
using PcBuilderBackend.Application.Catalog.WiredNetworkAdapters.Commands.ImportWiredNetworkAdapters;
using PcBuilderBackend.Application.Catalog.WiredNetworkAdapters.Commands.UpdateWiredNetworkAdapter;
using PcBuilderBackend.Application.Catalog.WiredNetworkAdapters.Dto;
using PcBuilderBackend.Application.Catalog.WiredNetworkAdapters.Queries;
using PcBuilderBackend.Application.Common.Dto;

namespace PcBuilderBackend.Api.Endpoints.Catalog;

public static class WiredNetworkAdapterEndpoints
{
    public static void MapWiredNetworkAdapterEndpoints(this RouteGroupBuilder group)
    {
        var subgroup = group.MapGroup("wired-network-adapter")
            .WithSidebarGroup("Catalog", "Wired Network Adapter")
            .WithDescription("Browse, Read, Edit, Add and Delete wired network adapters");

        subgroup.MapGet("/", GetWiredNetworkAdapters)
            .Produces<PagedResult<WiredNetworkAdapterDto>>()
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Browse wired network adapters")
            .WithDescription("\n    GET /catalog/wired-network-adapter");

        subgroup.MapMethods("/", [HttpMethods.Query], QueryWiredNetworkAdapters)
            .Produces<PagedResult<WiredNetworkAdapterDto>>()
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Filter wired network adapters")
            .WithDescription("\n    QUERY /catalog/wired-network-adapter");

        subgroup.MapGet("/{id:guid}", GetWiredNetworkAdapterById)
            .Produces<WiredNetworkAdapterDto>()
            .Produces(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Read wired network adapter by ID")
            .WithDescription("\n    GET /catalog/wired-network-adapter/{id}");

        subgroup.MapPost("/", CreateWiredNetworkAdapter)
            .Produces<WiredNetworkAdapterDto>(StatusCodes.Status201Created)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Add a wired network adapter")
            .WithDescription("\n    QUERY /catalog/wired-network-adapter");

        subgroup.MapPost("/bulk", BulkCreateWiredNetworkAdapters)
            .Produces<List<WiredNetworkAdapterDto>>(StatusCodes.Status201Created)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Add multiple wired network adapters")
            .WithDescription("\n    QUERY /catalog/wired-network-adapter/bulk");

        subgroup.MapPut("/", UpdateWiredNetworkAdapter)
            .Produces<WiredNetworkAdapterDto>()
            .Produces(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Edit a wired network adapter")
            .WithDescription("\n    PUT /catalog/wired-network-adapter");

        subgroup.MapPut("/bulk", BulkUpdateWiredNetworkAdapters)
            .Produces<List<WiredNetworkAdapterDto>>()
            .Produces(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Edit multiple wired network adapters")
            .WithDescription("\n    PUT /catalog/wired-network-adapter/bulk");

        subgroup.MapDelete("/{id:guid}", DeleteWiredNetworkAdapter)
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Delete a wired network adapter")
            .WithDescription("\n    DELETE /catalog/wired-network-adapter/{id}");

        subgroup.MapDelete("/bulk", BulkDeleteWiredNetworkAdapters)
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Delete multiple wired network adapters")
            .WithDescription("\n    DELETE /catalog/wired-network-adapter/bulk");

        subgroup.MapPost("/import", ImportWiredNetworkAdapters)
            .Produces<List<WiredNetworkAdapterDto>>()
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .Accepts<IFormFile>("multipart/form-data")
            .DisableAntiforgery()
            .WithSummary("Import wired network adapters from Excel")
            .WithDescription("\n    QUERY /catalog/wired-network-adapter/import");
    }

    private static async Task<Ok<PagedResult<WiredNetworkAdapterDto>>> GetWiredNetworkAdapters(
        [FromServices] ISender sender,
        [AsParameters] PagedRequest request,
        CancellationToken cancellationToken)
    {
        var query = new GetWiredNetworkAdaptersQuery(request);
        return TypedResults.Ok(await sender.Send(query, cancellationToken));
    }

    private static async Task<Ok<PagedResult<WiredNetworkAdapterDto>>> QueryWiredNetworkAdapters(
        [FromServices] ISender sender,
        [FromBody] PagedRequest<WiredNetworkAdapterFilter> request,
        CancellationToken cancellationToken)
    {
        var query = new FilterWiredNetworkAdaptersQuery(request);
        return TypedResults.Ok(await sender.Send(query, cancellationToken));
    }

    private static async Task<Results<Ok<WiredNetworkAdapterDto>, NotFound>> GetWiredNetworkAdapterById(
        [FromRoute] Guid id,
        [FromServices] ISender sender,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetWiredNetworkAdapterByIdQuery(id), cancellationToken);
        return result is null ? TypedResults.NotFound() : TypedResults.Ok(result);
    }

    private static async Task<Created<WiredNetworkAdapterDto>> CreateWiredNetworkAdapter(
        [Validate] [FromBody] CreateWiredNetworkAdapterCommand command,
        [FromServices] ISender sender,
        HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(command, cancellationToken);
        return TypedResults.Created($"{httpContext.Request.Path}/{result.Id}", result);
    }

    private static async Task<Results<Ok<WiredNetworkAdapterDto>, NotFound>> UpdateWiredNetworkAdapter(
        [Validate] [FromBody] UpdateWiredNetworkAdapterCommand command,
        [FromServices] ISender sender,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(command, cancellationToken);
        return result is null ? TypedResults.NotFound() : TypedResults.Ok(result);
    }

    private static async Task<Results<NoContent, NotFound>> DeleteWiredNetworkAdapter(
        [FromRoute] Guid id,
        [FromServices] ISender sender,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new DeleteWiredNetworkAdapterCommand(id), cancellationToken);
        return result ? TypedResults.NoContent() : TypedResults.NotFound();
    }

    private static async Task<Created<List<WiredNetworkAdapterDto>>> BulkCreateWiredNetworkAdapters(
        [Validate] [FromBody] BulkCreateWiredNetworkAdaptersCommand command,
        [FromServices] ISender sender,
        HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(command, cancellationToken);
        return TypedResults.Created($"{httpContext.Request.Path}", result);
    }

    private static async Task<Results<Ok<List<WiredNetworkAdapterDto>>, NotFound>> BulkUpdateWiredNetworkAdapters(
        [Validate] [FromBody] BulkUpdateWiredNetworkAdaptersCommand command,
        [FromServices] ISender sender,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(command, cancellationToken);
        return result is null || result.Count == 0 ? TypedResults.NotFound() : TypedResults.Ok(result);
    }

    private static async Task<Results<NoContent, NotFound>> BulkDeleteWiredNetworkAdapters(
        [Validate] [FromBody] BulkDeleteWiredNetworkAdaptersCommand command,
        [FromServices] ISender sender,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(command, cancellationToken);
        return result ? TypedResults.NoContent() : TypedResults.NotFound();
    }

    private static async Task<Ok<List<WiredNetworkAdapterDto>>> ImportWiredNetworkAdapters(
        IFormFile file,
        [FromServices] ISender sender,
        CancellationToken cancellationToken)
    {
        await using var fileStream = file.OpenReadStream();
        var result = await sender.Send(new ImportWiredNetworkAdaptersCommand(fileStream), cancellationToken);
        return TypedResults.Ok(result);
    }
}
