using MediatR;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using PcBuilderBackend.Api.Extensions;
using PcBuilderBackend.Api.Filters;
using PcBuilderBackend.Application.Catalog.WirelessNetworkAdapters.Commands.BulkCreateWirelessNetworkAdapters;
using PcBuilderBackend.Application.Catalog.WirelessNetworkAdapters.Commands.BulkDeleteWirelessNetworkAdapters;
using PcBuilderBackend.Application.Catalog.WirelessNetworkAdapters.Commands.BulkUpdateWirelessNetworkAdapters;
using PcBuilderBackend.Application.Catalog.WirelessNetworkAdapters.Commands.CreateWirelessNetworkAdapter;
using PcBuilderBackend.Application.Catalog.WirelessNetworkAdapters.Commands.DeleteWirelessNetworkAdapter;
using PcBuilderBackend.Application.Catalog.WirelessNetworkAdapters.Commands.ImportWirelessNetworkAdapters;
using PcBuilderBackend.Application.Catalog.WirelessNetworkAdapters.Commands.UpdateWirelessNetworkAdapter;
using PcBuilderBackend.Application.Catalog.WirelessNetworkAdapters.Dto;
using PcBuilderBackend.Application.Catalog.WirelessNetworkAdapters.Queries;
using PcBuilderBackend.Application.Common.Dto;

namespace PcBuilderBackend.Api.Endpoints.Catalog;

public static class WirelessNetworkAdapterEndpoints
{
    public static void MapWirelessNetworkAdapterEndpoints(this RouteGroupBuilder group)
    {
        var subgroup = group.MapGroup("wireless-network-adapter")
            .WithSidebarGroup("Catalog", "Wireless Network Adapter")
            .WithDescription("Browse, Read, Edit, Add and Delete wireless network adapters");

        subgroup.MapGet("/", GetWirelessNetworkAdapters)
            .Produces<PagedResult<WirelessNetworkAdapterDto>>()
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Browse wireless network adapters")
            .WithDescription("\n    GET /catalog/wireless-network-adapter");

        subgroup.MapMethods("/", [HttpMethods.Query], QueryWirelessNetworkAdapters)
            .Produces<PagedResult<WirelessNetworkAdapterDto>>()
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Filter wireless network adapters")
            .WithDescription("\n    QUERY /catalog/wireless-network-adapter");

        subgroup.MapGet("/{id:guid}", GetWirelessNetworkAdapterById)
            .Produces<WirelessNetworkAdapterDto>()
            .Produces(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Read wireless network adapter by ID")
            .WithDescription("\n    GET /catalog/wireless-network-adapter/{id}");

        subgroup.MapPost("/", CreateWirelessNetworkAdapter)
            .Produces<WirelessNetworkAdapterDto>(StatusCodes.Status201Created)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Add a wireless network adapter")
            .WithDescription("\n    QUERY /catalog/wireless-network-adapter");

        subgroup.MapPost("/bulk", BulkCreateWirelessNetworkAdapters)
            .Produces<List<WirelessNetworkAdapterDto>>(StatusCodes.Status201Created)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Add multiple wireless network adapters")
            .WithDescription("\n    QUERY /catalog/wireless-network-adapter/bulk");

        subgroup.MapPut("/", UpdateWirelessNetworkAdapter)
            .Produces<WirelessNetworkAdapterDto>()
            .Produces(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Edit a wireless network adapter")
            .WithDescription("\n    PUT /catalog/wireless-network-adapter");

        subgroup.MapPut("/bulk", BulkUpdateWirelessNetworkAdapters)
            .Produces<List<WirelessNetworkAdapterDto>>()
            .Produces(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Edit multiple wireless network adapters")
            .WithDescription("\n    PUT /catalog/wireless-network-adapter/bulk");

        subgroup.MapDelete("/{id:guid}", DeleteWirelessNetworkAdapter)
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Delete a wireless network adapter")
            .WithDescription("\n    DELETE /catalog/wireless-network-adapter/{id}");

        subgroup.MapDelete("/bulk", BulkDeleteWirelessNetworkAdapters)
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Delete multiple wireless network adapters")
            .WithDescription("\n    DELETE /catalog/wireless-network-adapter/bulk");

        subgroup.MapPost("/import", ImportWirelessNetworkAdapters)
            .Produces<List<WirelessNetworkAdapterDto>>()
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .Accepts<IFormFile>("multipart/form-data")
            .DisableAntiforgery()
            .WithSummary("Import wireless network adapters from Excel")
            .WithDescription("\n    QUERY /catalog/wireless-network-adapter/import");
    }

    private static async Task<Ok<PagedResult<WirelessNetworkAdapterDto>>> GetWirelessNetworkAdapters(
        [FromServices] ISender sender,
        [AsParameters] PagedRequest request,
        CancellationToken cancellationToken)
    {
        var query = new GetWirelessNetworkAdaptersQuery(request);
        return TypedResults.Ok(await sender.Send(query, cancellationToken));
    }

    private static async Task<Ok<PagedResult<WirelessNetworkAdapterDto>>> QueryWirelessNetworkAdapters(
        [FromServices] ISender sender,
        [FromBody] PagedRequest<WirelessNetworkAdapterFilter> request,
        CancellationToken cancellationToken)
    {
        var query = new FilterWirelessNetworkAdaptersQuery(request);
        return TypedResults.Ok(await sender.Send(query, cancellationToken));
    }

    private static async Task<Results<Ok<WirelessNetworkAdapterDto>, NotFound>> GetWirelessNetworkAdapterById(
        [FromRoute] Guid id,
        [FromServices] ISender sender,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetWirelessNetworkAdapterByIdQuery(id), cancellationToken);
        return result is null ? TypedResults.NotFound() : TypedResults.Ok(result);
    }

    private static async Task<Created<WirelessNetworkAdapterDto>> CreateWirelessNetworkAdapter(
        [Validate] [FromBody] CreateWirelessNetworkAdapterCommand command,
        [FromServices] ISender sender,
        HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(command, cancellationToken);
        return TypedResults.Created($"{httpContext.Request.Path}/{result.Id}", result);
    }

    private static async Task<Results<Ok<WirelessNetworkAdapterDto>, NotFound>> UpdateWirelessNetworkAdapter(
        [Validate] [FromBody] UpdateWirelessNetworkAdapterCommand command,
        [FromServices] ISender sender,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(command, cancellationToken);
        return result is null ? TypedResults.NotFound() : TypedResults.Ok(result);
    }

    private static async Task<Results<NoContent, NotFound>> DeleteWirelessNetworkAdapter(
        [FromRoute] Guid id,
        [FromServices] ISender sender,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new DeleteWirelessNetworkAdapterCommand(id), cancellationToken);
        return result ? TypedResults.NoContent() : TypedResults.NotFound();
    }

    private static async Task<Created<List<WirelessNetworkAdapterDto>>> BulkCreateWirelessNetworkAdapters(
        [Validate] [FromBody] BulkCreateWirelessNetworkAdaptersCommand command,
        [FromServices] ISender sender,
        HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(command, cancellationToken);
        return TypedResults.Created($"{httpContext.Request.Path}", result);
    }

    private static async Task<Results<Ok<List<WirelessNetworkAdapterDto>>, NotFound>> BulkUpdateWirelessNetworkAdapters(
        [Validate] [FromBody] BulkUpdateWirelessNetworkAdaptersCommand command,
        [FromServices] ISender sender,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(command, cancellationToken);
        return result is null || result.Count == 0 ? TypedResults.NotFound() : TypedResults.Ok(result);
    }

    private static async Task<Results<NoContent, NotFound>> BulkDeleteWirelessNetworkAdapters(
        [Validate] [FromBody] BulkDeleteWirelessNetworkAdaptersCommand command,
        [FromServices] ISender sender,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(command, cancellationToken);
        return result ? TypedResults.NoContent() : TypedResults.NotFound();
    }

    private static async Task<Ok<List<WirelessNetworkAdapterDto>>> ImportWirelessNetworkAdapters(
        IFormFile file,
        [FromServices] ISender sender,
        CancellationToken cancellationToken)
    {
        await using var fileStream = file.OpenReadStream();
        var result = await sender.Send(new ImportWirelessNetworkAdaptersCommand(fileStream), cancellationToken);
        return TypedResults.Ok(result);
    }
}
