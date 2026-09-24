using MediatR;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using PcBuilderBackend.Api.Extensions;
using PcBuilderBackend.Api.Filters;
using PcBuilderBackend.Application.Catalog.Motherboards.Commands.BulkUpdateMotherboardM2Slots;
using PcBuilderBackend.Application.Catalog.Motherboards.Commands.BulkUpdateMotherboardPcieSlots;
using PcBuilderBackend.Application.Catalog.Motherboards.Commands.BulkUpdateMotherboardUsbPorts;
using PcBuilderBackend.Application.Catalog.Motherboards.Commands.BulkDeleteMotherboards;
using PcBuilderBackend.Application.Catalog.Motherboards.Commands.CreateMotherboard;
using PcBuilderBackend.Application.Catalog.Motherboards.Commands.DeleteMotherboard;
using PcBuilderBackend.Application.Catalog.Motherboards.Commands.ImportMotherboards;
using PcBuilderBackend.Application.Catalog.Motherboards.Commands.UpdateMotherboard;
using PcBuilderBackend.Application.Catalog.Motherboards.Dto;
using PcBuilderBackend.Application.Catalog.Motherboards.Queries;
using PcBuilderBackend.Application.Common.Dto;

namespace PcBuilderBackend.Api.Endpoints.Catalog;

public static class MotherboardEndpoints
{
    public static void MapMotherboardEndpoints(this RouteGroupBuilder group)
    {
        var subgroup = group.MapGroup("motherboard")
            .WithSidebarGroup("Catalog", "Motherboard")
            .WithDescription("Browse, Read, Edit, Add and Delete Motherboards");

        subgroup.MapGet("/", GetMotherboards)
            .Produces<PagedResult<MotherboardListItemDto>>()
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Browse Motherboards")
            .WithDescription("\n    GET /catalog/motherboard");

        subgroup.MapPost("/query", FilterMotherboards)
            .Produces<PagedResult<MotherboardListItemDto>>()
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Filter Motherboards")
            .WithDescription("\n    POST /catalog/motherboard/query");

        subgroup.MapGet("/{id}", GetMotherboardById)
            .Produces<MotherboardDto>()
            .Produces(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Get Motherboard By ID")
            .WithDescription("\n    GET /catalog/motherboard/00000000-0000-0000-0000-000000000000");

        subgroup.MapPost("/", CreateMotherboard)
            .Produces<MotherboardDto>(StatusCodes.Status201Created)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Create Motherboard")
            .WithDescription("\n    POST /catalog/motherboard");

        subgroup.MapPut("/", UpdateMotherboard)
            .Produces<MotherboardDto>()
            .Produces(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Update Motherboard")
            .WithDescription("\n    PUT /catalog/motherboard");

        subgroup.MapDelete("/{id}", DeleteMotherboard)
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Delete Motherboard")
            .WithDescription("\n    DELETE /catalog/motherboard/00000000-0000-0000-0000-000000000000");

        subgroup.MapDelete("/bulk", BulkDeleteMotherboards)
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Delete multiple Motherboards")
            .WithDescription("\n    DELETE /catalog/motherboard/bulk");

        subgroup.MapPost("/import", ImportMotherboards)
            .Produces<List<MotherboardDto>>()
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .Accepts<IFormFile>("multipart/form-data")
            .DisableAntiforgery()
            .WithSummary("Import Motherboards from Excel")
            .WithDescription("\n    POST /catalog/motherboard/import");

        var pcieGroup = subgroup.MapGroup("{motherboardId}/pcie-slot")
            .WithDescription("Manage motherboard PCIe slots");

        pcieGroup.MapGet("/", GetMotherboardPcieSlots)
            .Produces<List<MotherboardPcieDto>>()
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Get motherboard PCIe slots")
            .WithDescription("\n    GET /catalog/motherboard/00000000-0000-0000-0000-000000000000/pcie-slot");

        pcieGroup.MapPut("/", UpdateMotherboardPcieSlots)
            .Produces<List<MotherboardPcieDto>>()
            .Produces(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Replace motherboard PCIe slots")
            .WithDescription("\n    PUT /catalog/motherboard/00000000-0000-0000-0000-000000000000/pcie-slot");

        var m2Group = subgroup.MapGroup("{motherboardId}/m2-slot")
            .WithDescription("Manage motherboard M.2 slots");

        m2Group.MapGet("/", GetMotherboardM2Slots)
            .Produces<List<MotherboardM2Dto>>()
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Get motherboard M.2 slots")
            .WithDescription("\n    GET /catalog/motherboard/00000000-0000-0000-0000-000000000000/m2-slot");

        m2Group.MapPut("/", UpdateMotherboardM2Slots)
            .Produces<List<MotherboardM2Dto>>()
            .Produces(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Replace motherboard M.2 slots")
            .WithDescription("\n    PUT /catalog/motherboard/00000000-0000-0000-0000-000000000000/m2-slot");

        var usbGroup = subgroup.MapGroup("{motherboardId}/usb-port")
            .WithDescription("Manage motherboard USB ports");

        usbGroup.MapGet("/", GetMotherboardUsbPorts)
            .Produces<List<MotherboardUsbDto>>()
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Get motherboard USB ports")
            .WithDescription("\n    GET /catalog/motherboard/00000000-0000-0000-0000-000000000000/usb-port");

        usbGroup.MapPut("/", UpdateMotherboardUsbPorts)
            .Produces<List<MotherboardUsbDto>>()
            .Produces(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Replace motherboard USB ports")
            .WithDescription("\n    PUT /catalog/motherboard/00000000-0000-0000-0000-000000000000/usb-port");
    }

    private static async Task<Ok<PagedResult<MotherboardListItemDto>>> GetMotherboards(
        [AsParameters] PagedRequest request,
        [FromServices] ISender sender,
        CancellationToken cancellationToken)
    {
        var query = new GetMotherboardsQuery(request);
        var result = await sender.Send(query, cancellationToken);
        return TypedResults.Ok(result);
    }

    private static async Task<Ok<PagedResult<MotherboardListItemDto>>> FilterMotherboards(
        [FromBody] PagedRequest<MotherboardFilter> request,
        [FromServices] ISender sender,
        CancellationToken cancellationToken)
    {
        var query = new FilterMotherboardsQuery(request);
        var result = await sender.Send(query, cancellationToken);
        return TypedResults.Ok(result);
    }

    private static async Task<Results<Ok<MotherboardDto>, NotFound>> GetMotherboardById(
        [FromRoute] Guid id,
        [FromServices] ISender sender,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetMotherboardByIdQuery(id), cancellationToken);
        return result is null ? TypedResults.NotFound() : TypedResults.Ok(result);
    }

    private static async Task<Created<MotherboardDto>> CreateMotherboard(
        [Validate] [FromBody] CreateMotherboardCommand command,
        [FromServices] ISender sender,
        HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(command, cancellationToken);
        return TypedResults.Created($"{httpContext.Request.Path}/{result.Id}", result);
    }

    private static async Task<Results<Ok<MotherboardDto>, NotFound>> UpdateMotherboard(
        [Validate] [FromBody] UpdateMotherboardCommand command,
        [FromServices] ISender sender,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(command, cancellationToken);
        return result is null ? TypedResults.NotFound() : TypedResults.Ok(result);
    }

    private static async Task<Results<NoContent, NotFound>> DeleteMotherboard(
        [Validate] [FromRoute] Guid id,
        [FromServices] ISender sender,
        CancellationToken cancellationToken)
    {
        var success = await sender.Send(new DeleteMotherboardCommand(id), cancellationToken);
        return success ? TypedResults.NoContent() : TypedResults.NotFound();
    }

    private static async Task<Results<NoContent, NotFound>> BulkDeleteMotherboards(
        [FromBody] BulkDeleteMotherboardsCommand command,
        [FromServices] ISender sender,
        CancellationToken cancellationToken)
    {
        var success = await sender.Send(command, cancellationToken);
        return success ? TypedResults.NoContent() : TypedResults.NotFound();
    }

    private static async Task<Ok<List<MotherboardDto>>> ImportMotherboards(
        IFormFile file,
        [FromServices] ISender sender,
        CancellationToken cancellationToken)
    {
        await using var fileStream = file.OpenReadStream();
        var result = await sender.Send(new ImportMotherboardsCommand(fileStream), cancellationToken);
        return TypedResults.Ok(result);
    }

    private static async Task<Ok<List<MotherboardPcieDto>>> GetMotherboardPcieSlots(
        [FromRoute] Guid motherboardId,
        [FromServices] ISender sender,
        CancellationToken cancellationToken)
    {
        return TypedResults.Ok(
            await sender.Send(new GetMotherboardPcieSlotsByMotherboardIdQuery(motherboardId), cancellationToken));
    }

    private static async Task<Results<Ok<List<MotherboardPcieDto>>, NotFound>> UpdateMotherboardPcieSlots(
        [FromRoute] Guid motherboardId,
        [FromBody] List<MotherboardPcieDto> pcieSlots,
        [FromServices] ISender sender,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(
            new BulkUpdateMotherboardPcieSlotsCommand(motherboardId, pcieSlots),
            cancellationToken);

        return result is null ? TypedResults.NotFound() : TypedResults.Ok(result);
    }

    private static async Task<Ok<List<MotherboardM2Dto>>> GetMotherboardM2Slots(
        [FromRoute] Guid motherboardId,
        [FromServices] ISender sender,
        CancellationToken cancellationToken)
    {
        return TypedResults.Ok(
            await sender.Send(new GetMotherboardM2SlotsByMotherboardIdQuery(motherboardId), cancellationToken));
    }

    private static async Task<Results<Ok<List<MotherboardM2Dto>>, NotFound>> UpdateMotherboardM2Slots(
        [FromRoute] Guid motherboardId,
        [FromBody] List<MotherboardM2Dto> m2Slots,
        [FromServices] ISender sender,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(
            new BulkUpdateMotherboardM2SlotsCommand(motherboardId, m2Slots),
            cancellationToken);

        return result is null ? TypedResults.NotFound() : TypedResults.Ok(result);
    }

    private static async Task<Ok<List<MotherboardUsbDto>>> GetMotherboardUsbPorts(
        [FromRoute] Guid motherboardId,
        [FromServices] ISender sender,
        CancellationToken cancellationToken)
    {
        return TypedResults.Ok(
            await sender.Send(new GetMotherboardUsbPortsByMotherboardIdQuery(motherboardId), cancellationToken));
    }

    private static async Task<Results<Ok<List<MotherboardUsbDto>>, NotFound>> UpdateMotherboardUsbPorts(
        [FromRoute] Guid motherboardId,
        [FromBody] List<MotherboardUsbDto> usbPorts,
        [FromServices] ISender sender,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(
            new BulkUpdateMotherboardUsbPortsCommand(motherboardId, usbPorts),
            cancellationToken);

        return result is null ? TypedResults.NotFound() : TypedResults.Ok(result);
    }
}
