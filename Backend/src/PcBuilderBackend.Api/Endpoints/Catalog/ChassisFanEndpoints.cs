using MediatR;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using PcBuilderBackend.Api.Extensions;
using PcBuilderBackend.Api.Filters;
using PcBuilderBackend.Application.Catalog.ChassisFans.Commands.BulkCreateChassisFans;
using PcBuilderBackend.Application.Catalog.ChassisFans.Commands.BulkDeleteChassisFans;
using PcBuilderBackend.Application.Catalog.ChassisFans.Commands.BulkUpdateChassisFans;
using PcBuilderBackend.Application.Catalog.ChassisFans.Commands.CreateChassisFan;
using PcBuilderBackend.Application.Catalog.ChassisFans.Commands.DeleteChassisFan;
using PcBuilderBackend.Application.Catalog.ChassisFans.Commands.ImportChassisFans;
using PcBuilderBackend.Application.Catalog.ChassisFans.Commands.UpdateChassisFan;
using PcBuilderBackend.Application.Catalog.ChassisFans.Dto;
using PcBuilderBackend.Application.Catalog.ChassisFans.Queries;
using PcBuilderBackend.Application.Common.Dto;

namespace PcBuilderBackend.Api.Endpoints.Catalog;

public static class ChassisFanEndpoints
{
    public static void MapChassisFanEndpoints(this RouteGroupBuilder group)
    {
        var subgroup = group.MapGroup("chassis-fan")
            .WithSidebarGroup("Catalog", "Chassis Fan")
            .WithDescription("Browse, Read, Edit, Add and Delete chassis fans");

        subgroup.MapGet("/", GetChassisFans)
            .Produces<PagedResult<ChassisFanDto>>()
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Browse chassis fans")
            .WithDescription("\n    GET /catalog/chassis-fan");

        subgroup.MapMethods("/", [HttpMethods.Query], QueryChassisFans)
            .Produces<PagedResult<ChassisFanDto>>()
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Filter chassis fans")
            .WithDescription("\n    QUERY /catalog/chassis-fan");

        subgroup.MapGet("/{id:guid}", GetChassisFanById)
            .Produces<ChassisFanDto>()
            .Produces(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Read a chassis fan by ID")
            .WithDescription("\n    GET /catalog/chassis-fan/{id}");

        subgroup.MapPost("/", CreateChassisFan)
            .Produces<ChassisFanDto>(StatusCodes.Status201Created)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Add a chassis fan")
            .WithDescription("\n    QUERY /catalog/chassis-fan");

        subgroup.MapPost("/bulk", BulkCreateChassisFans)
            .Produces<List<ChassisFanDto>>(StatusCodes.Status201Created)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Add multiple chassis fans")
            .WithDescription("\n    QUERY /catalog/chassis-fan/bulk");

        subgroup.MapPut("/", UpdateChassisFan)
            .Produces<ChassisFanDto>()
            .Produces(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Edit a chassis fan")
            .WithDescription("\n    PUT /catalog/chassis-fan");

        subgroup.MapPut("/bulk", BulkUpdateChassisFans)
            .Produces<List<ChassisFanDto>>()
            .Produces(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Edit multiple chassis fans")
            .WithDescription("\n    PUT /catalog/chassis-fan/bulk");

        subgroup.MapDelete("/{id:guid}", DeleteChassisFan)
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Delete a chassis fan")
            .WithDescription("\n    DELETE /catalog/chassis-fan/{id}");

        subgroup.MapDelete("/bulk", BulkDeleteChassisFans)
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Delete multiple chassis fans")
            .WithDescription("\n    DELETE /catalog/chassis-fan/bulk");

        subgroup.MapPost("/import", ImportChassisFans)
            .Produces<List<ChassisFanDto>>()
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .Accepts<IFormFile>("multipart/form-data")
            .DisableAntiforgery()
            .WithSummary("Import chassis fans from Excel")
            .WithDescription("\n    QUERY /catalog/chassis-fan/import");
    }

    private static async Task<Ok<PagedResult<ChassisFanDto>>> GetChassisFans(
        [FromServices] ISender sender,
        [AsParameters] PagedRequest request,
        CancellationToken cancellationToken)
    {
        var query = new GetChassisFansQuery(request);
        return TypedResults.Ok(await sender.Send(query, cancellationToken));
    }

    private static async Task<Ok<PagedResult<ChassisFanDto>>> QueryChassisFans(
        [FromServices] ISender sender,
        [FromBody] PagedRequest<ChassisFanFilter> request,
        CancellationToken cancellationToken)
    {
        var query = new FilterChassisFansQuery(request);
        return TypedResults.Ok(await sender.Send(query, cancellationToken));
    }

    private static async Task<Results<Ok<ChassisFanDto>, NotFound>> GetChassisFanById(
        [FromRoute] Guid id,
        [FromServices] ISender sender,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetChassisFanByIdQuery(id), cancellationToken);
        return result is null ? TypedResults.NotFound() : TypedResults.Ok(result);
    }

    private static async Task<Created<ChassisFanDto>> CreateChassisFan(
        [Validate] [FromBody] CreateChassisFanCommand command,
        [FromServices] ISender sender,
        HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(command, cancellationToken);
        return TypedResults.Created($"{httpContext.Request.Path}/{result.Id}", result);
    }

    private static async Task<Results<Ok<ChassisFanDto>, NotFound>> UpdateChassisFan(
        [Validate] [FromBody] UpdateChassisFanCommand command,
        [FromServices] ISender sender,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(command, cancellationToken);
        return result is null ? TypedResults.NotFound() : TypedResults.Ok(result);
    }

    private static async Task<Results<NoContent, NotFound>> DeleteChassisFan(
        [FromRoute] Guid id,
        [FromServices] ISender sender,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new DeleteChassisFanCommand(id), cancellationToken);
        return result ? TypedResults.NoContent() : TypedResults.NotFound();
    }

    private static async Task<Created<List<ChassisFanDto>>> BulkCreateChassisFans(
        [Validate] [FromBody] BulkCreateChassisFansCommand command,
        [FromServices] ISender sender,
        HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(command, cancellationToken);
        return TypedResults.Created($"{httpContext.Request.Path}", result);
    }

    private static async Task<Results<Ok<List<ChassisFanDto>>, NotFound>> BulkUpdateChassisFans(
        [Validate] [FromBody] BulkUpdateChassisFansCommand command,
        [FromServices] ISender sender,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(command, cancellationToken);
        return result is null || result.Count == 0 ? TypedResults.NotFound() : TypedResults.Ok(result);
    }

    private static async Task<Results<NoContent, NotFound>> BulkDeleteChassisFans(
        [Validate] [FromBody] BulkDeleteChassisFansCommand command,
        [FromServices] ISender sender,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(command, cancellationToken);
        return result ? TypedResults.NoContent() : TypedResults.NotFound();
    }

    private static async Task<Ok<List<ChassisFanDto>>> ImportChassisFans(
        IFormFile file,
        [FromServices] ISender sender,
        CancellationToken cancellationToken)
    {
        await using var fileStream = file.OpenReadStream();
        var result = await sender.Send(new ImportChassisFansCommand(fileStream), cancellationToken);
        return TypedResults.Ok(result);
    }
}
