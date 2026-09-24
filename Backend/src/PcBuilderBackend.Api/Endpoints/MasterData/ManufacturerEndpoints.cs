using MediatR;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using PcBuilderBackend.Api.Extensions;
using PcBuilderBackend.Api.Filters;
using PcBuilderBackend.Application.MasterData.Manufacturers.Commands.BulkCreateManufacturers;
using PcBuilderBackend.Application.MasterData.Manufacturers.Commands.BulkDeleteManufacturers;
using PcBuilderBackend.Application.MasterData.Manufacturers.Commands.BulkUpdateManufacturers;
using PcBuilderBackend.Application.MasterData.Manufacturers.Commands.CreateManufacturer;
using PcBuilderBackend.Application.MasterData.Manufacturers.Commands.DeleteManufacturer;
using PcBuilderBackend.Application.MasterData.Manufacturers.Commands.ImportManufacturers;
using PcBuilderBackend.Application.MasterData.Manufacturers.Commands.UpdateManufacturer;
using PcBuilderBackend.Application.MasterData.Manufacturers.Dto;
using PcBuilderBackend.Application.MasterData.Manufacturers.Queries;
using PcBuilderBackend.Domain.Enums;

namespace PcBuilderBackend.Api.Endpoints.MasterData;

public static class ManufacturerEndpoints
{
    public static void MapManufacturerEndpoints(this RouteGroupBuilder group)
    {
        var subgroup = group.MapGroup("manufacturer")
            .WithSidebarGroup(parentName: "MasterData", childTag: "Manufacturer")
            .WithDescription("Browse, Read, Edit, Add and Delete Manufacturers");

        subgroup.MapGet("/", GetManufacturers)
            .Produces<List<ManufacturerDto>>()
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Browse Manufacturers")
            .WithDescription("\n    GET /master-data/manufacturer");

        subgroup.MapGet("/{productType}", GetManufacturersByProductType)
            .Produces<List<ManufacturerDto>>()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Browse Manufacturers by product type")
            .WithDescription("\n    GET /master-data/manufacturer/cpu");

        subgroup.MapGet("/{id:guid}", GetManufacturerById)
            .Produces<ManufacturerDto>()
            .Produces(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Read a Manufacturer by ID")
            .WithDescription("\n    GET /master-data/manufacturer/00000000-0000-0000-0000-000000000000");

        subgroup.MapPut("/", UpdateManufacturer)
            .Produces<ManufacturerDto>()
            .Produces(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Edit a Manufacturer")
            .WithDescription("\n    PUT /master-data/manufacturer \n {\n\"id\":\"00000000-0000-0000-0000-000000000000\",\n\"name\":\"ASUS\"\n}");
        
        subgroup.MapPut("/bulk", BulkUpdateManufacturers)
            .Produces<List<ManufacturerDto>>()
            .Produces(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Edit multiple Manufacturers")
            .WithDescription("\n    PUT /master-data/manufacturer/bulk \n [{\n\"id\":\"00000000-0000-0000-0000-000000000000\",\n\"name\":\"ASUS\"\n}]");

        subgroup.MapPost("/", CreateManufacturer)
            .Produces<ManufacturerDto>(StatusCodes.Status201Created)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Add a new Manufacturer")
            .WithDescription("\n    POST /master-data/manufacturer \n {\n\"name\":\"ASUS\"\n}");
        
        subgroup.MapPost("/bulk", BulkCreateManufacturers)
            .Produces<List<ManufacturerDto>>(StatusCodes.Status201Created)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Add multiple Manufacturers")
            .WithDescription("\n    POST /master-data/manufacturer/bulk \n [\n{\n\"name\":\"ASUS\"\n},\n{\n\"name\":\"MSI\"\n}\n]");

        subgroup.MapDelete("/{id}", DeleteManufacturer)
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Delete a Manufacturer")
            .WithDescription("\n    DELETE /master-data/manufacturer/00000000-0000-0000-0000-000000000000");

        subgroup.MapDelete("/bulk", BulkDeleteManufacturers)
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Delete multiple Manufacturers")
            .WithDescription("\n    DELETE /master-data/manufacturer/bulk \n [\"00000000-0000-0000-0000-000000000000\"]");

        subgroup.MapPost("/import", ImportManufacturers)
            .Produces<List<ManufacturerDto>>()
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .Accepts<IFormFile>("multipart/form-data")
            .DisableAntiforgery()
            .WithSummary("Import Manufacturers from Excel")
            .WithDescription("\n    POST /master-data/manufacturer/import");
    }

    private static async Task<Ok<List<ManufacturerDto>>> GetManufacturers(
        [FromServices] ISender sender,
        CancellationToken cancellationToken)
    {
        return TypedResults.Ok(await sender.Send(new GetManufacturersQuery(), cancellationToken));
    }

    private static async Task<Results<Ok<List<ManufacturerDto>>, ProblemHttpResult>> GetManufacturersByProductType(
        [FromRoute] string productType,
        [FromServices] ISender sender,
        CancellationToken cancellationToken)
    {
        if (!TryParseProductType(productType, out var parsed))
        {
            return TypedResults.Problem(
                detail: "Unknown product type.",
                statusCode: StatusCodes.Status400BadRequest);
        }

        return TypedResults.Ok(
            await sender.Send(new GetManufacturersByProductTypeQuery(parsed), cancellationToken));
    }

    private static bool TryParseProductType(string productType, out ProductType parsed)
    {
        parsed = default;
        return !int.TryParse(productType, out _)
            && Enum.TryParse(productType, ignoreCase: true, out parsed)
            && Enum.IsDefined(parsed);
    }

    private static async Task<Results<Ok<ManufacturerDto>, NotFound>> GetManufacturerById(
        [Validate] [FromRoute] Guid id,
        [FromServices] ISender sender,
        CancellationToken cancellationToken
    )
    {
        var result = await sender.Send(new GetManufacturerByIdQuery(id), cancellationToken);
        return result is null ? TypedResults.NotFound() : TypedResults.Ok(result);
    }

    private static async Task<Results<Ok<ManufacturerDto>, NotFound>> UpdateManufacturer(
        [Validate] [FromBody] UpdateManufacturerCommand command,
        [FromServices] ISender sender,
        CancellationToken cancellationToken
    )
    {
        var result = await sender.Send(command, cancellationToken);
        return result is null ? TypedResults.NotFound() : TypedResults.Ok(result);
    }
    
    private static async Task<Created<ManufacturerDto>> CreateManufacturer(
        [Validate] [FromBody] CreateManufacturerCommand command,
        [FromServices] ISender sender,
        HttpContext context,
        CancellationToken cancellationToken
    )
    {
        return TypedResults.Created(context.Request.Path, await sender.Send(command, cancellationToken));
    }

    private static async Task<Results<NoContent, NotFound>> DeleteManufacturer(
        [Validate] [FromRoute] Guid id,
        [FromServices] ISender sender,
        CancellationToken cancellationToken
    )
    {
        var success = await sender.Send(new DeleteManufacturerCommand(id), cancellationToken);
        return success ? TypedResults.NoContent() : TypedResults.NotFound();
    }
    
    private static async Task<Created<List<ManufacturerDto>>> BulkCreateManufacturers(
        [Validate] [FromBody] BulkCreateManufacturersCommand command,
        [FromServices] ISender sender,
        HttpContext context,
        CancellationToken cancellationToken
    )
    {
        return TypedResults.Created(context.Request.Path, await sender.Send(command, cancellationToken));
    }
    
    private static async Task<Results<Ok<List<ManufacturerDto>>, NotFound>> BulkUpdateManufacturers(
        [Validate] [FromBody] BulkUpdateManufacturersCommand command,
        [FromServices] ISender sender,
        CancellationToken cancellationToken
    )
    {
        var result = await sender.Send(command, cancellationToken);
        return result is null || result.Count == 0 ? TypedResults.NotFound() : TypedResults.Ok(result);
    }
    
    private static async Task<Results<NoContent, NotFound>> BulkDeleteManufacturers(
        [Validate] [FromBody] BulkDeleteManufacturersCommand command,
        [FromServices] ISender sender,
        CancellationToken cancellationToken
    )
    {
        var success = await sender.Send(command, cancellationToken);
        return success ? TypedResults.NoContent() : TypedResults.NotFound();
    }

    private static async Task<Ok<List<ManufacturerDto>>> ImportManufacturers(
        IFormFile file,
        [FromServices] ISender sender,
        CancellationToken cancellationToken)
    {
        await using var fileStream = file.OpenReadStream();
        return TypedResults.Ok(await sender.Send(new ImportManufacturersCommand(fileStream), cancellationToken));
    }
}
