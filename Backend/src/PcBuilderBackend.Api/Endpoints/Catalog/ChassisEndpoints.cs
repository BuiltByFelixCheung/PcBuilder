using MediatR;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using PcBuilderBackend.Api.Extensions;
using PcBuilderBackend.Api.Filters;
using PcBuilderBackend.Application.Catalog.Chassis.Commands.BulkCreateChassis;
using PcBuilderBackend.Application.Catalog.Chassis.Commands.BulkDeleteChassis;
using PcBuilderBackend.Application.Catalog.Chassis.Commands.BulkUpdateChassis;
using PcBuilderBackend.Application.Catalog.Chassis.Commands.BulkUpdateChassisDriveBays;
using PcBuilderBackend.Application.Catalog.Chassis.Commands.BulkUpdateChassisFanMounts;
using PcBuilderBackend.Application.Catalog.Chassis.Commands.BulkUpdateChassisMbFormFactors;
using PcBuilderBackend.Application.Catalog.Chassis.Commands.BulkUpdateChassisPcieSlots;
using PcBuilderBackend.Application.Catalog.Chassis.Commands.BulkUpdateChassisPsuFormFactors;
using PcBuilderBackend.Application.Catalog.Chassis.Commands.BulkUpdateChassisRadiators;
using PcBuilderBackend.Application.Catalog.Chassis.Commands.CreateChassis;
using PcBuilderBackend.Application.Catalog.Chassis.Commands.DeleteChassis;
using PcBuilderBackend.Application.Catalog.Chassis.Commands.ImportChassis;
using PcBuilderBackend.Application.Catalog.Chassis.Commands.UpdateChassis;
using PcBuilderBackend.Application.Catalog.Chassis.Dto;
using PcBuilderBackend.Application.Catalog.Chassis.Queries;
using PcBuilderBackend.Application.Common.Dto;
using PcBuilderBackend.Domain.Enums;

namespace PcBuilderBackend.Api.Endpoints.Catalog;

public static class ChassisEndpoints
{
    public static void MapChassisEndpoints(this RouteGroupBuilder group)
    {
        var subgroup = group.MapGroup("chassis")
            .WithSidebarGroup("Catalog", "Chassis")
            .WithDescription("Browse, Read, Edit, Add and Delete Chassis");

        subgroup.MapGet("/", GetChassis)
            .Produces<PagedResult<ChassisListItemDto>>()
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Browse Chassis")
            .WithDescription("\n    GET /catalog/chassis");

        subgroup.MapGet("/{id}", GetChassisById)
            .Produces<ChassisDto>()
            .Produces(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Get Chassis by ID")
            .WithDescription("\n    GET /catalog/chassis/{id}");

        subgroup.MapMethods("/", [HttpMethods.Query], QueryChassis)
            .Produces<PagedResult<ChassisListItemDto>>()
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Filter Chassis")
            .WithDescription("\n    QUERY /catalog/chassis");

        subgroup.MapPut("/", UpdateChassis)
            .Produces<ChassisDto>()
            .Produces(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Update Chassis")
            .WithDescription("\n    PUT /catalog/chassis");

        subgroup.MapPost("/", CreateChassis)
            .Produces<ChassisDto>()
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Create Chassis")
            .WithDescription("\n    POST /catalog/chassis");

        subgroup.MapDelete("/{id}", DeleteChassis)
            .Produces(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Delete Chassis")
            .WithDescription("\n    DELETE /catalog/chassis/{id}");
        
        subgroup.MapPut("/bulk", BulkUpdateChassis)
            .Produces<List<ChassisDto>>()
            .Produces(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Bulk Update Chassis")
            .WithDescription("\n    PUT /catalog/chassis/bulk");
        
        subgroup.MapPost("/bulk", BulkCreateChassis)
            .Produces<List<ChassisDto>>()
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Bulk Create Chassis")
            .WithDescription("\n    POST /catalog/chassis/bulk");
        
        subgroup.MapDelete("/bulk", BulkDeleteChassis)
            .Produces(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Bulk Delete Chassis")
            .WithDescription("\n    DELETE /catalog/chassis/bulk");

        subgroup.MapPost("/import", ImportChassis)
            .Produces<List<ChassisDto>>()
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .Accepts<IFormFile>("multipart/form-data")
            .DisableAntiforgery()
            .WithSummary("Import Chassis from Excel")
            .WithDescription("\n    POST /catalog/chassis/import");

        var driveBayGroup = subgroup.MapGroup("{chassisId:guid}/drive-bay")
            .WithDescription("Manage chassis drive bays");

        driveBayGroup.MapGet("/", GetChassisDriveBays)
            .Produces<List<ChassisDriveBayDto>>()
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Get chassis drive bays")
            .WithDescription("\n    GET /catalog/chassis/{id}/drive-bay");

        driveBayGroup.MapPut("/", UpdateChassisDriveBays)
            .Produces<List<ChassisDriveBayDto>>()
            .Produces(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Replace chassis drive bays")
            .WithDescription("\n    PUT /catalog/chassis/{id}/drive-bay");

        var fanMountGroup = subgroup.MapGroup("{chassisId:guid}/fan-mount")
            .WithDescription("Manage chassis fan mounts");

        fanMountGroup.MapGet("/", GetChassisFanMounts)
            .Produces<List<ChassisFanMountDto>>()
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Get chassis fan mounts")
            .WithDescription("\n    GET /catalog/chassis/{id}/fan-mount");

        fanMountGroup.MapPut("/", UpdateChassisFanMounts)
            .Produces<List<ChassisFanMountDto>>()
            .Produces(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Replace chassis fan mounts")
            .WithDescription("\n    PUT /catalog/chassis/{id}/fan-mount");

        var pcieGroup = subgroup.MapGroup("{chassisId:guid}/pcie-slot")
            .WithDescription("Manage chassis PCIe slots");

        pcieGroup.MapGet("/", GetChassisPcieSlots)
            .Produces<List<ChassisPcieSlotDto>>()
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Get chassis PCIe slots")
            .WithDescription("\n    GET /catalog/chassis/{id}/pcie-slot");

        pcieGroup.MapPut("/", UpdateChassisPcieSlots)
            .Produces<List<ChassisPcieSlotDto>>()
            .Produces(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Replace chassis PCIe slots")
            .WithDescription("\n    PUT /catalog/chassis/{id}/pcie-slot");

        var radiatorGroup = subgroup.MapGroup("{chassisId:guid}/radiator")
            .WithDescription("Manage chassis radiators");

        radiatorGroup.MapGet("/", GetChassisRadiators)
            .Produces<List<ChassisRadiatorDto>>()
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Get chassis radiators")
            .WithDescription("\n    GET /catalog/chassis/{id}/radiator");

        radiatorGroup.MapPut("/", UpdateChassisRadiators)
            .Produces<List<ChassisRadiatorDto>>()
            .Produces(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Replace chassis radiators")
            .WithDescription("\n    PUT /catalog/chassis/{id}/radiator");

        var mbFormFactorGroup = subgroup.MapGroup("{chassisId:guid}/mb-form-factor")
            .WithDescription("Manage chassis motherboard form factors");

        mbFormFactorGroup.MapGet("/", GetChassisMbFormFactors)
            .Produces<List<MbFormFactor>>()
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Get chassis motherboard form factors")
            .WithDescription("\n    GET /catalog/chassis/{id}/mb-form-factor");

        mbFormFactorGroup.MapPut("/", UpdateChassisMbFormFactors)
            .Produces<List<MbFormFactor>>()
            .Produces(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Replace chassis motherboard form factors")
            .WithDescription("\n    PUT /catalog/chassis/{id}/mb-form-factor");

        var psuFormFactorGroup = subgroup.MapGroup("{chassisId:guid}/psu-form-factor")
            .WithDescription("Manage chassis PSU form factors");

        psuFormFactorGroup.MapGet("/", GetChassisPsuFormFactors)
            .Produces<List<PsuFormFactor>>()
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Get chassis PSU form factors")
            .WithDescription("\n    GET /catalog/chassis/{id}/psu-form-factor");

        psuFormFactorGroup.MapPut("/", UpdateChassisPsuFormFactors)
            .Produces<List<PsuFormFactor>>()
            .Produces(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Replace chassis PSU form factors")
            .WithDescription("\n    PUT /catalog/chassis/{id}/psu-form-factor");
    }

    private static async Task<Ok<PagedResult<ChassisListItemDto>>> GetChassis(
        [FromServices] ISender sender,
        [AsParameters] PagedRequest request,
        CancellationToken cancellationToken)
    {
        var query = new GetChassisQuery(request);
        var result = await sender.Send(query, cancellationToken);
        return TypedResults.Ok(result);
    }

    private static async Task<Ok<PagedResult<ChassisListItemDto>>> QueryChassis(
        [FromServices] ISender sender,
        [FromBody] PagedRequest<ChassisFilter> request,
        CancellationToken cancellationToken)
    {
        var query = new FilterChassisQuery(request);
        var result = await sender.Send(query, cancellationToken);
        return TypedResults.Ok(result);
    }

    private static async Task<Results<Ok<ChassisDto>, NotFound>> GetChassisById(
        [FromServices] ISender sender,
        [FromRoute] Guid id,
        CancellationToken cancellationToken)
    {
        var query = new GetChassisByIdQuery(id);
        var result = await sender.Send(query, cancellationToken);
        return result is null ? TypedResults.NotFound() : TypedResults.Ok(result);
    }

    private static async Task<Results<Ok<ChassisDto>, NotFound>> UpdateChassis(
        [FromServices] ISender sender,
        [Validate] [FromBody] UpdateChassisCommand command,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(command, cancellationToken);
        return result is null ? TypedResults.NotFound() : TypedResults.Ok(result);
    }

    private static async Task<Created<ChassisDto>> CreateChassis(
        [FromServices] ISender sender,
        [Validate] [FromBody] CreateChassisCommand command,
        HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(command, cancellationToken);
        return TypedResults.Created($"{httpContext.Request.Path}/{result.Id}", result);
    }

    private static async Task<Results<NoContent, NotFound>> DeleteChassis(
        [FromServices] ISender sender,
        [FromRoute] Guid id,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new DeleteChassisCommand(id), cancellationToken);
        return result ? TypedResults.NoContent() : TypedResults.NotFound();
    }

    private static async Task<Results<Ok<List<ChassisDto>>, NotFound>> BulkUpdateChassis(
        [Validate] [FromBody] BulkUpdateChassisCommand command,
        [FromServices] ISender sender,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(command, cancellationToken);
        return result is null ? TypedResults.NotFound() : TypedResults.Ok(result);
    }

    private static async Task<Created<List<ChassisDto>>> BulkCreateChassis(
        [Validate] [FromBody] BulkCreateChassisCommand command,
        [FromServices] ISender sender,
        HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(command, cancellationToken);
        return TypedResults.Created($"{httpContext.Request.Path}", result);
    }

    private static async Task<Results<NoContent, NotFound>> BulkDeleteChassis(
        [FromServices] ISender sender,
        [Validate] [FromBody] BulkDeleteChassisCommand command,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(command, cancellationToken);
        return result ? TypedResults.NoContent() : TypedResults.NotFound();
    }

    private static async Task<Ok<List<ChassisDto>>> ImportChassis(
        IFormFile file,
        [FromServices] ISender sender,
        CancellationToken cancellationToken)
    {
        await using var fileStream = file.OpenReadStream();
        var result = await sender.Send(new ImportChassisCommand(fileStream), cancellationToken);
        return TypedResults.Ok(result);
    }

    private static async Task<Ok<List<ChassisDriveBayDto>>> GetChassisDriveBays(
        [FromRoute] Guid chassisId,
        [FromServices] ISender sender,
        CancellationToken cancellationToken)
    {
        return TypedResults.Ok(
            await sender.Send(new GetChassisDriveBaysByChassisIdQuery(chassisId), cancellationToken));
    }

    private static async Task<Results<Ok<List<ChassisDriveBayDto>>, NotFound>> UpdateChassisDriveBays(
        [FromRoute] Guid chassisId,
        [FromBody] List<ChassisDriveBayDto> driveBays,
        [FromServices] ISender sender,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(
            new BulkUpdateChassisDriveBaysCommand(chassisId, driveBays),
            cancellationToken);

        return result is null ? TypedResults.NotFound() : TypedResults.Ok(result);
    }

    private static async Task<Ok<List<ChassisFanMountDto>>> GetChassisFanMounts(
        [FromRoute] Guid chassisId,
        [FromServices] ISender sender,
        CancellationToken cancellationToken)
    {
        return TypedResults.Ok(
            await sender.Send(new GetChassisFanMountsByChassisIdQuery(chassisId), cancellationToken));
    }

    private static async Task<Results<Ok<List<ChassisFanMountDto>>, NotFound>> UpdateChassisFanMounts(
        [FromRoute] Guid chassisId,
        [FromBody] List<ChassisFanMountDto> fanMounts,
        [FromServices] ISender sender,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(
            new BulkUpdateChassisFanMountsCommand(chassisId, fanMounts),
            cancellationToken);

        return result is null ? TypedResults.NotFound() : TypedResults.Ok(result);
    }

    private static async Task<Ok<List<ChassisPcieSlotDto>>> GetChassisPcieSlots(
        [FromRoute] Guid chassisId,
        [FromServices] ISender sender,
        CancellationToken cancellationToken)
    {
        return TypedResults.Ok(
            await sender.Send(new GetChassisPcieSlotsByChassisIdQuery(chassisId), cancellationToken));
    }

    private static async Task<Results<Ok<List<ChassisPcieSlotDto>>, NotFound>> UpdateChassisPcieSlots(
        [FromRoute] Guid chassisId,
        [FromBody] List<ChassisPcieSlotDto> pcieSlots,
        [FromServices] ISender sender,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(
            new BulkUpdateChassisPcieSlotsCommand(chassisId, pcieSlots),
            cancellationToken);

        return result is null ? TypedResults.NotFound() : TypedResults.Ok(result);
    }

    private static async Task<Ok<List<ChassisRadiatorDto>>> GetChassisRadiators(
        [FromRoute] Guid chassisId,
        [FromServices] ISender sender,
        CancellationToken cancellationToken)
    {
        return TypedResults.Ok(
            await sender.Send(new GetChassisRadiatorsByChassisIdQuery(chassisId), cancellationToken));
    }

    private static async Task<Results<Ok<List<ChassisRadiatorDto>>, NotFound>> UpdateChassisRadiators(
        [FromRoute] Guid chassisId,
        [FromBody] List<ChassisRadiatorDto> radiators,
        [FromServices] ISender sender,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(
            new BulkUpdateChassisRadiatorsCommand(chassisId, radiators),
            cancellationToken);

        return result is null ? TypedResults.NotFound() : TypedResults.Ok(result);
    }

    private static async Task<Ok<List<MbFormFactor>>> GetChassisMbFormFactors(
        [FromRoute] Guid chassisId,
        [FromServices] ISender sender,
        CancellationToken cancellationToken)
    {
        return TypedResults.Ok(
            await sender.Send(new GetChassisMbFormFactorsByChassisIdQuery(chassisId), cancellationToken));
    }

    private static async Task<Results<Ok<List<MbFormFactor>>, NotFound>> UpdateChassisMbFormFactors(
        [FromRoute] Guid chassisId,
        [FromBody] List<MbFormFactor> mbFormFactors,
        [FromServices] ISender sender,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(
            new BulkUpdateChassisMbFormFactorsCommand(chassisId, mbFormFactors),
            cancellationToken);

        return result is null ? TypedResults.NotFound() : TypedResults.Ok(result);
    }

    private static async Task<Ok<List<PsuFormFactor>>> GetChassisPsuFormFactors(
        [FromRoute] Guid chassisId,
        [FromServices] ISender sender,
        CancellationToken cancellationToken)
    {
        return TypedResults.Ok(
            await sender.Send(new GetChassisPsuFormFactorsByChassisIdQuery(chassisId), cancellationToken));
    }

    private static async Task<Results<Ok<List<PsuFormFactor>>, NotFound>> UpdateChassisPsuFormFactors(
        [FromRoute] Guid chassisId,
        [FromBody] List<PsuFormFactor> psuFormFactors,
        [FromServices] ISender sender,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(
            new BulkUpdateChassisPsuFormFactorsCommand(chassisId, psuFormFactors),
            cancellationToken);

        return result is null ? TypedResults.NotFound() : TypedResults.Ok(result);
    }
}