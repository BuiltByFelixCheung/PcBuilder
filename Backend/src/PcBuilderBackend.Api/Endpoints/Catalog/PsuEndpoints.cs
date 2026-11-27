using MediatR;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using PcBuilderBackend.Api.Extensions;
using PcBuilderBackend.Api.Filters;
using PcBuilderBackend.Application.Catalog.Psus.Commands.BulkCreatePsus;
using PcBuilderBackend.Application.Catalog.Psus.Commands.BulkDeletePsus;
using PcBuilderBackend.Application.Catalog.Psus.Commands.BulkUpdatePsuCables;
using PcBuilderBackend.Application.Catalog.Psus.Commands.BulkUpdatePsus;
using PcBuilderBackend.Application.Catalog.Psus.Commands.CreatePsu;
using PcBuilderBackend.Application.Catalog.Psus.Commands.DeletePsu;
using PcBuilderBackend.Application.Catalog.Psus.Commands.ImportPsus;
using PcBuilderBackend.Application.Catalog.Psus.Commands.UpdatePsu;
using PcBuilderBackend.Application.Catalog.Psus.Dto;
using PcBuilderBackend.Application.Catalog.Psus.Queries;
using PcBuilderBackend.Application.Common.Dto;

namespace PcBuilderBackend.Api.Endpoints.Catalog;

public static class PsuEndpoints
{
    public static void MapPsuEndpoints(this RouteGroupBuilder group)
    {
        var subgroup = group.MapGroup("psu")
            .WithSidebarGroup("Catalog", "PSU")
            .WithDescription("Browse, Read, Edit, Add and Delete power supplies");

        subgroup.MapGet("/", GetPsus)
            .Produces<PagedResult<PsuListItemDto>>()
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Browse power supplies")
            .WithDescription("\n    GET /catalog/psu");

        subgroup.MapMethods("/", [HttpMethods.Query], QueryPsus)
            .Produces<PagedResult<PsuListItemDto>>()
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Filter power supplies")
            .WithDescription("\n    QUERY /catalog/psu");

        subgroup.MapGet("/{id:guid}", GetPsuById)
            .Produces<PsuDto>()
            .Produces(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Read power supply by ID")
            .WithDescription("\n    GET /catalog/psu/{id}");

        subgroup.MapPost("/", CreatePsu)
            .Produces<PsuDto>(StatusCodes.Status201Created)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Add a power supply")
            .WithDescription("\n    POST /catalog/psu");

        subgroup.MapPost("/bulk", BulkCreatePsus)
            .Produces<List<PsuDto>>(StatusCodes.Status201Created)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Add multiple power supplies")
            .WithDescription("\n    POST /catalog/psu/bulk");

        subgroup.MapPut("/", UpdatePsu)
            .Produces<PsuDto>()
            .Produces(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Edit a power supply")
            .WithDescription("\n    PUT /catalog/psu");

        subgroup.MapPut("/bulk", BulkUpdatePsus)
            .Produces<List<PsuDto>>()
            .Produces(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Edit multiple power supplies")
            .WithDescription("\n    PUT /catalog/psu/bulk");

        subgroup.MapDelete("/{id:guid}", DeletePsu)
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Delete a power supply")
            .WithDescription("\n    DELETE /catalog/psu/{id}");

        subgroup.MapDelete("/bulk", BulkDeletePsus)
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Delete multiple power supplies")
            .WithDescription("\n    DELETE /catalog/psu/bulk");

        subgroup.MapPost("/import", ImportPsus)
            .Produces<List<PsuDto>>()
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .Accepts<IFormFile>("multipart/form-data")
            .DisableAntiforgery()
            .WithSummary("Import power supplies from Excel")
            .WithDescription("\n    POST /catalog/psu/import");

        var cableGroup = subgroup.MapGroup("{psuId:guid}/cable")
            .WithDescription("Manage PSU cables");

        cableGroup.MapGet("/", GetPsuCables)
            .Produces<List<PsuCableDto>>()
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Get PSU cables")
            .WithDescription("\n    GET /catalog/psu/{id}/cable");

        cableGroup.MapPut("/", UpdatePsuCables)
            .Produces<List<PsuCableDto>>()
            .Produces(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Replace PSU cables")
            .WithDescription("\n    PUT /catalog/psu/{id}/cable");
    }

    private static async Task<Ok<PagedResult<PsuListItemDto>>> GetPsus(
        [FromServices] ISender sender,
        [AsParameters] PagedRequest request,
        CancellationToken cancellationToken)
    {
        var query = new GetPsusQuery(request);
        return TypedResults.Ok(await sender.Send(query, cancellationToken));
    }

    private static async Task<Ok<PagedResult<PsuListItemDto>>> QueryPsus(
        [FromServices] ISender sender,
        [FromBody] PagedRequest<PsuFilter> request,
        CancellationToken cancellationToken)
    {
        var query = new FilterPsusQuery(request);
        return TypedResults.Ok(await sender.Send(query, cancellationToken));
    }

    private static async Task<Results<Ok<PsuDto>, NotFound>> GetPsuById(
        [FromRoute] Guid id,
        [FromServices] ISender sender,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetPsuByIdQuery(id), cancellationToken);
        return result is null ? TypedResults.NotFound() : TypedResults.Ok(result);
    }

    private static async Task<Created<PsuDto>> CreatePsu(
        [Validate] [FromBody] CreatePsuCommand command,
        [FromServices] ISender sender,
        HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(command, cancellationToken);
        return TypedResults.Created($"{httpContext.Request.Path}/{result.Id}", result);
    }

    private static async Task<Results<Ok<PsuDto>, NotFound>> UpdatePsu(
        [Validate] [FromBody] UpdatePsuCommand command,
        [FromServices] ISender sender,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(command, cancellationToken);
        return result is null ? TypedResults.NotFound() : TypedResults.Ok(result);
    }

    private static async Task<Results<NoContent, NotFound>> DeletePsu(
        [FromRoute] Guid id,
        [FromServices] ISender sender,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new DeletePsuCommand(id), cancellationToken);
        return result ? TypedResults.NoContent() : TypedResults.NotFound();
    }

    private static async Task<Created<List<PsuDto>>> BulkCreatePsus(
        [Validate] [FromBody] BulkCreatePsusCommand command,
        [FromServices] ISender sender,
        HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(command, cancellationToken);
        return TypedResults.Created($"{httpContext.Request.Path}", result);
    }

    private static async Task<Results<Ok<List<PsuDto>>, NotFound>> BulkUpdatePsus(
        [Validate] [FromBody] BulkUpdatePsusCommand command,
        [FromServices] ISender sender,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(command, cancellationToken);
        return result is null || result.Count == 0 ? TypedResults.NotFound() : TypedResults.Ok(result);
    }

    private static async Task<Results<NoContent, NotFound>> BulkDeletePsus(
        [Validate] [FromBody] BulkDeletePsusCommand command,
        [FromServices] ISender sender,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(command, cancellationToken);
        return result ? TypedResults.NoContent() : TypedResults.NotFound();
    }

    private static async Task<Ok<List<PsuDto>>> ImportPsus(
        IFormFile file,
        [FromServices] ISender sender,
        CancellationToken cancellationToken)
    {
        await using var fileStream = file.OpenReadStream();
        var result = await sender.Send(new ImportPsusCommand(fileStream), cancellationToken);
        return TypedResults.Ok(result);
    }

    private static async Task<Ok<List<PsuCableDto>>> GetPsuCables(
        [FromRoute] Guid psuId,
        [FromServices] ISender sender,
        CancellationToken cancellationToken)
    {
        return TypedResults.Ok(
            await sender.Send(new GetPsuCablesByPsuIdQuery(psuId), cancellationToken));
    }

    private static async Task<Results<Ok<List<PsuCableDto>>, NotFound>> UpdatePsuCables(
        [FromRoute] Guid psuId,
        [FromBody] List<PsuCableDto> cables,
        [FromServices] ISender sender,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(
            new BulkUpdatePsuCablesCommand(psuId, cables),
            cancellationToken);

        return result is null ? TypedResults.NotFound() : TypedResults.Ok(result);
    }
}
