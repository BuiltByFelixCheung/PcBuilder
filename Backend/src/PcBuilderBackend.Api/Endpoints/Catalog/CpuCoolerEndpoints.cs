using MediatR;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using PcBuilderBackend.Api.Extensions;
using PcBuilderBackend.Api.Filters;
using PcBuilderBackend.Application.Catalog.CpuCoolers.Commands.BulkCreateCpuCoolers;
using PcBuilderBackend.Application.Catalog.CpuCoolers.Commands.BulkDeleteCpuCoolers;
using PcBuilderBackend.Application.Catalog.CpuCoolers.Commands.BulkUpdateCpuCoolers;
using PcBuilderBackend.Application.Catalog.CpuCoolers.Commands.BulkUpdateCpuCoolerSockets;
using PcBuilderBackend.Application.Catalog.CpuCoolers.Commands.CreateCpuCooler;
using PcBuilderBackend.Application.Catalog.CpuCoolers.Commands.DeleteCpuCooler;
using PcBuilderBackend.Application.Catalog.CpuCoolers.Commands.ImportCpuCoolers;
using PcBuilderBackend.Application.Catalog.CpuCoolers.Commands.UpdateCpuCooler;
using PcBuilderBackend.Application.Catalog.CpuCoolers.Dto;
using PcBuilderBackend.Application.Catalog.CpuCoolers.Queries;
using PcBuilderBackend.Application.Common.Dto;

namespace PcBuilderBackend.Api.Endpoints.Catalog;

public static class CpuCoolerEndpoints
{
    public static void MapCpuCoolerEndpoints(this RouteGroupBuilder group)
    {
        var subgroup = group.MapGroup("cpu-cooler")
            .WithSidebarGroup("Catalog", "CPU Cooler")
            .WithDescription("Browse, Read, Edit, Add and Delete CPU coolers");

        subgroup.MapGet("/", GetCpuCoolers)
            .Produces<PagedResult<CpuCoolerListItemDto>>()
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Browse CPU coolers")
            .WithDescription("\n    GET /catalog/cpu-cooler");

        subgroup.MapMethods("/", [HttpMethods.Query], QueryCpuCoolers)
            .Produces<PagedResult<CpuCoolerListItemDto>>()
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Filter CPU coolers")
            .WithDescription(
                "\n    QUERY /api/catalog/cpu-cooler" +
                "\n    All filters are optional. When cpuId, chassisId, or ramId is provided, " +
                "results are limited to coolers that are not incompatible with that part.");

        subgroup.MapGet("/{id:guid}", GetCpuCoolerById)
            .Produces<CpuCoolerDto>()
            .Produces(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Read a CPU cooler by ID")
            .WithDescription("\n    GET /catalog/cpu-cooler/00000000-0000-0000-0000-000000000000");

        subgroup.MapPost("/", CreateCpuCooler)
            .Produces<CpuCoolerDto>(StatusCodes.Status201Created)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Add a CPU cooler")
            .WithDescription("\n    POST /catalog/cpu-cooler");

        subgroup.MapPost("/bulk", BulkCreateCpuCoolers)
            .Produces<List<CpuCoolerDto>>(StatusCodes.Status201Created)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Add multiple CPU coolers")
            .WithDescription("\n    POST /catalog/cpu-cooler/bulk");

        subgroup.MapPut("/", UpdateCpuCooler)
            .Produces<CpuCoolerDto>()
            .Produces(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Edit a CPU cooler")
            .WithDescription("\n    PUT /catalog/cpu-cooler");

        subgroup.MapPut("/bulk", BulkUpdateCpuCoolers)
            .Produces<List<CpuCoolerDto>>()
            .Produces(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Edit multiple CPU coolers")
            .WithDescription("\n    PUT /catalog/cpu-cooler/bulk");

        subgroup.MapDelete("/{id:guid}", DeleteCpuCooler)
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Delete a CPU cooler")
            .WithDescription("\n    DELETE /catalog/cpu-cooler/00000000-0000-0000-0000-000000000000");

        subgroup.MapDelete("/bulk", BulkDeleteCpuCoolers)
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Delete multiple CPU coolers")
            .WithDescription("\n    DELETE /catalog/cpu-cooler/bulk");

        subgroup.MapPost("/import", ImportCpuCoolers)
            .Produces<List<CpuCoolerDto>>()
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .Accepts<IFormFile>("multipart/form-data")
            .DisableAntiforgery()
            .WithSummary("Import CPU coolers from Excel")
            .WithDescription("\n    POST /catalog/cpu-cooler/import");

        var socketGroup = subgroup.MapGroup("{cpuCoolerId:guid}/socket")
            .WithDescription("Manage CPU cooler supported sockets");

        socketGroup.MapGet("/", GetCpuCoolerSockets)
            .Produces<List<CpuCoolerSocketDto>>()
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Get CPU cooler sockets")
            .WithDescription("\n    GET /catalog/cpu-cooler/00000000-0000-0000-0000-000000000000/socket");

        socketGroup.MapPut("/", UpdateCpuCoolerSockets)
            .Produces<List<CpuCoolerSocketDto>>()
            .Produces(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Replace CPU cooler sockets")
            .WithDescription("\n    PUT /catalog/cpu-cooler/00000000-0000-0000-0000-000000000000/socket");
    }

    private static async Task<Ok<PagedResult<CpuCoolerListItemDto>>> GetCpuCoolers(
        [AsParameters] PagedRequest request,
        [FromServices] ISender sender,
        CancellationToken cancellationToken)
    {
        var query = new GetCpuCoolersQuery(request);
        return TypedResults.Ok(await sender.Send(query, cancellationToken));
    }

    private static async Task<Ok<PagedResult<CpuCoolerListItemDto>>> QueryCpuCoolers(
        [FromBody] PagedRequest<CpuCoolerFilter> request,
        [FromServices] ISender sender,
        CancellationToken cancellationToken)
    {
        var query = new FilterCpuCoolersQuery(request);
        return TypedResults.Ok(await sender.Send(query, cancellationToken));
    }

    private static async Task<Results<Ok<CpuCoolerDto>, NotFound>> GetCpuCoolerById(
        [FromRoute] Guid id,
        [FromServices] ISender sender,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetCpuCoolerByIdQuery(id), cancellationToken);
        return result is null ? TypedResults.NotFound() : TypedResults.Ok(result);
    }

    private static async Task<Created<CpuCoolerDto>> CreateCpuCooler(
        [Validate] [FromBody] CreateCpuCoolerCommand command,
        [FromServices] ISender sender,
        HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(command, cancellationToken);
        return TypedResults.Created($"{httpContext.Request.Path}/{result.Id}", result);
    }

    private static async Task<Results<Ok<CpuCoolerDto>, NotFound>> UpdateCpuCooler(
        [Validate] [FromBody] UpdateCpuCoolerCommand command,
        [FromServices] ISender sender,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(command, cancellationToken);
        return result is null ? TypedResults.NotFound() : TypedResults.Ok(result);
    }

    private static async Task<Results<NoContent, NotFound>> DeleteCpuCooler(
        [FromRoute] Guid id,
        [FromServices] ISender sender,
        CancellationToken cancellationToken)
    {
        var success = await sender.Send(new DeleteCpuCoolerCommand(id), cancellationToken);
        return success ? TypedResults.NoContent() : TypedResults.NotFound();
    }

    private static async Task<Created<List<CpuCoolerDto>>> BulkCreateCpuCoolers(
        [Validate] [FromBody] BulkCreateCpuCoolersCommand command,
        [FromServices] ISender sender,
        HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(command, cancellationToken);
        return TypedResults.Created($"{httpContext.Request.Path}", result);
    }

    private static async Task<Results<Ok<List<CpuCoolerDto>>, NotFound>> BulkUpdateCpuCoolers(
        [Validate] [FromBody] BulkUpdateCpuCoolersCommand command,
        [FromServices] ISender sender,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(command, cancellationToken);
        return result is null || result.Count == 0 ? TypedResults.NotFound() : TypedResults.Ok(result);
    }

    private static async Task<Results<NoContent, NotFound>> BulkDeleteCpuCoolers(
        [Validate] [FromBody] BulkDeleteCpuCoolersCommand command,
        [FromServices] ISender sender,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(command, cancellationToken);
        return result ? TypedResults.NoContent() : TypedResults.NotFound();
    }

    private static async Task<Ok<List<CpuCoolerSocketDto>>> GetCpuCoolerSockets(
        [FromRoute] Guid cpuCoolerId,
        [FromServices] ISender sender,
        CancellationToken cancellationToken)
    {
        return TypedResults.Ok(
            await sender.Send(new GetCpuCoolerSocketsByCpuCoolerIdQuery(cpuCoolerId), cancellationToken));
    }

    private static async Task<Results<Ok<List<CpuCoolerSocketDto>>, NotFound>> UpdateCpuCoolerSockets(
        [FromRoute] Guid cpuCoolerId,
        [FromBody] List<CpuCoolerSocketDto> sockets,
        [FromServices] ISender sender,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(
            new BulkUpdateCpuCoolerSocketsCommand(cpuCoolerId, sockets),
            cancellationToken);

        return result is null ? TypedResults.NotFound() : TypedResults.Ok(result);
    }

    private static async Task<Ok<List<CpuCoolerDto>>> ImportCpuCoolers(
        IFormFile file,
        [FromServices] ISender sender,
        CancellationToken cancellationToken)
    {
        await using var fileStream = file.OpenReadStream();
        var result = await sender.Send(new ImportCpuCoolersCommand(fileStream), cancellationToken);
        return TypedResults.Ok(result);
    }
}
