using MediatR;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using PcBuilderBackend.Api.Extensions;
using PcBuilderBackend.Api.Filters;
using PcBuilderBackend.Application.Build.Commands.BulkDeletePcBuild;
using PcBuilderBackend.Application.Build.Commands.CreatePcBuild;
using PcBuilderBackend.Application.Build.Commands.DeletePcBuild;
using PcBuilderBackend.Application.Build.Commands.UpdatePcBuild;
using PcBuilderBackend.Application.Build.Dto;
using PcBuilderBackend.Application.Build.Queries;
using PcBuilderBackend.Application.Common.Authorization;
using PcBuilderBackend.Application.Common.Dto;

namespace PcBuilderBackend.Api.Endpoints.Build;

public static class PcBuildEndpoints
{
    public static void MapPcBuildEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("api/builds")
            .AddEndpointFilterFactory(ValidationFilter.ValidationFilterFactory)
            .WithSidebarGroup("Builds", "PC Build")
            .WithDescription("Check and persist PC builds");

        group.MapGet("/", ListPublic)
            .AllowAnonymous()
            .Produces<PagedResult<PcBuildListItemDto>>()
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Browse public PC builds")
            .WithDescription("\n    GET /api/builds");

        group.MapGet("/me", ListMine)
            .RequireAuthorization(AuthPolicies.BuildWrite)
            .Produces<PagedResult<PcBuildListItemDto>>()
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("List the current member's PC builds")
            .WithDescription("\n    GET /api/builds/me");

        group.MapGet("/{id:guid}", GetById)
            .AllowAnonymous()
            .Produces<PcBuildDto>()
            .Produces(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Read a PC build by ID")
            .WithDescription("\n    GET /api/builds/{id}");

        group.MapPost("/compatibility", CheckCompatibility)
            .AllowAnonymous()
            .Produces<CompatibilityCheckDto>()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Check draft compatibility")
            .WithDescription("\n    POST /api/builds/compatibility");

        group.MapPost("/", Create)
            .AllowAnonymous()
            .Produces<PcBuildDto>(StatusCodes.Status201Created)
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Create a PC build")
            .WithDescription(
                "\n    POST /api/builds" +
                "\n    A guest create returns pictureEditToken once. The guest sends it as" +
                "\n    X-PcBuild-Picture-Token when uploading or deleting pictures on that build.");

        group.MapPut("/", Update)
            .RequireAuthorization(AuthPolicies.BuildWrite)
            .Produces<PcBuildDto>()
            .Produces(StatusCodes.Status404NotFound)
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Update a PC build")
            .WithDescription("\n    PUT /api/builds");

        group.MapDelete("/bulk", BulkDelete)
            .RequireAuthorization(AuthPolicies.BuildWrite)
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status404NotFound)
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Delete multiple PC builds")
            .WithDescription("\n    DELETE /api/builds/bulk");

        group.MapBuildPictureEndpoints();

        group.MapDelete("/{id:guid}", Delete)
            .RequireAuthorization(AuthPolicies.BuildWrite)
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Delete a PC build")
            .WithDescription("\n    DELETE /api/builds/{id}");
    }

    private static async Task<Ok<PagedResult<PcBuildListItemDto>>> ListPublic(
        [FromServices] ISender sender,
        [AsParameters] PagedRequest request,
        CancellationToken cancellationToken) =>
        TypedResults.Ok(await sender.Send(new ListPublicPcBuildsQuery(request), cancellationToken));

    private static async Task<Ok<PagedResult<PcBuildListItemDto>>> ListMine(
        [FromServices] ISender sender,
        [AsParameters] PagedRequest request,
        CancellationToken cancellationToken) =>
        TypedResults.Ok(await sender.Send(new ListUserPcBuildsQuery(request), cancellationToken));

    private static async Task<Results<Ok<PcBuildDto>, NotFound>> GetById(
        [FromRoute] Guid id,
        [FromServices] ISender sender,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetPcBuildByIdQuery(id), cancellationToken);
        return result is null ? TypedResults.NotFound() : TypedResults.Ok(result);
    }

    private static async Task<Ok<CompatibilityCheckDto>> CheckCompatibility(
        [FromBody] CheckPcBuildCompatibilityQuery query,
        [FromServices] ISender sender,
        CancellationToken cancellationToken) =>
        TypedResults.Ok(await sender.Send(query, cancellationToken));

    private static async Task<Created<PcBuildDto>> Create(
        [Validate] [FromBody] CreatePcBuildCommand command,
        [FromServices] ISender sender,
        HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(command, cancellationToken);
        return TypedResults.Created($"{httpContext.Request.Path}/{result.Id}", result);
    }

    private static async Task<Results<Ok<PcBuildDto>, NotFound>> Update(
        [Validate] [FromBody] UpdatePcBuildCommand command,
        [FromServices] ISender sender,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(command, cancellationToken);
        return result is null ? TypedResults.NotFound() : TypedResults.Ok(result);
    }

    private static async Task<Results<NoContent, NotFound>> Delete(
        [FromRoute] Guid id,
        [FromServices] ISender sender,
        CancellationToken cancellationToken)
    {
        var deleted = await sender.Send(new DeletePcBuildCommand(id), cancellationToken);
        return deleted ? TypedResults.NoContent() : TypedResults.NotFound();
    }

    private static async Task<Results<NoContent, NotFound>> BulkDelete(
        [Validate] [FromBody] BulkDeletePcBuildCommand command,
        [FromServices] ISender sender,
        CancellationToken cancellationToken)
    {
        var deleted = await sender.Send(command, cancellationToken);
        return deleted ? TypedResults.NoContent() : TypedResults.NotFound();
    }
}
