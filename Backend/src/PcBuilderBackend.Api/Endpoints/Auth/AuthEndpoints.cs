using MediatR;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using PcBuilderBackend.Api.Auth;
using PcBuilderBackend.Api.Extensions;
using PcBuilderBackend.Api.Filters;
using PcBuilderBackend.Application.Auth.Commands.ChangePassword;
using PcBuilderBackend.Application.Auth.Commands.ForgotPassword;
using PcBuilderBackend.Application.Auth.Commands.Login;
using PcBuilderBackend.Application.Auth.Commands.Logout;
using PcBuilderBackend.Application.Auth.Commands.RefreshToken;
using PcBuilderBackend.Application.Auth.Commands.Register;
using PcBuilderBackend.Application.Auth.Commands.ResetPassword;
using PcBuilderBackend.Application.Auth.Dto;
using PcBuilderBackend.Application.Auth.Queries;
using PcBuilderBackend.Application.Common.Options;

namespace PcBuilderBackend.Api.Endpoints.Auth;

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("api/auth")
            .AddEndpointFilterFactory(ValidationFilter.ValidationFilterFactory)
            .WithSidebarGroup("Auth", "Auth")
            .WithDescription("Register, sign in, refresh, change or reset password, and inspect the current user");

        group.MapPost("/register", Register)
            .AllowAnonymous()
            .Produces<CurrentUserDto>(StatusCodes.Status201Created)
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Register a Member")
            .WithDescription("\n    POST /api/auth/register");

        group.MapPost("/login", Login)
            .AllowAnonymous()
            .Produces<AuthTokensDto>()
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status423Locked)
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Sign in")
            .WithDescription("\n    POST /api/auth/login");

        group.MapPost("/refresh", Refresh)
            .AllowAnonymous()
            .Produces<AuthTokensDto>()
            .Produces(StatusCodes.Status204NoContent)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Rotate refresh token")
            .WithDescription(
                "Missing cookie or body token returns 204 (guest). Invalid token returns 401.\n    POST /api/auth/refresh");

        group.MapPost("/logout", Logout)
            .AllowAnonymous()
            .Accepts<RefreshTokenRequest>("application/json")
            .Produces(StatusCodes.Status204NoContent)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithName("Logout")
            .WithSummary("Logout")
            .WithDescription(
                "Revokes the refresh token (JSON body or cookie) and clears the refresh cookie.\n    POST /api/auth/logout");

        group.MapGet("/me", Me)
            .RequireAuthorization()
            .Produces<CurrentUserDto>()
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Current user")
            .WithDescription("\n    GET /api/auth/me");

        group.MapPost("/forgot-password", ForgotPassword)
            .AllowAnonymous()
            .Produces(StatusCodes.Status204NoContent)
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Request a password reset")
            .WithDescription(
                "Always returns 204 so emails cannot be enumerated. A reset link is emailed when the account exists.\n    POST /api/auth/forgot-password");

        group.MapPost("/reset-password", ResetPassword)
            .AllowAnonymous()
            .Produces(StatusCodes.Status204NoContent)
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Reset password with emailed token")
            .WithDescription("\n    POST /api/auth/reset-password");

        group.MapPost("/change-password", ChangePassword)
            .RequireAuthorization()
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status401Unauthorized)
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Change password")
            .WithDescription(
                "Requires the current password. Revokes all refresh tokens so the user must sign in again.\n    POST /api/auth/change-password");
    }

    private static async Task<Results<Created<CurrentUserDto>, ValidationProblem>> Register(
        [Validate] [FromBody] RegisterCommand command,
        [FromServices] ISender sender,
        HttpContext context,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(command, cancellationToken);
        if (!result.Succeeded || result.User is null)
            return TypedResults.ValidationProblem(result.Errors);

        return TypedResults.Created($"{context.Request.Path}", result.User);
    }

    private static async Task<Results<Ok<AuthTokensDto>, UnauthorizedHttpResult, StatusCodeHttpResult>> Login(
        [Validate] [FromBody] LoginCommand command,
        [FromServices] ISender sender,
        [FromServices] JwtOptions jwt,
        HttpContext context,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(command, cancellationToken);
        if (result.IsLockedOut)
            return TypedResults.StatusCode(StatusCodes.Status423Locked);

        if (!result.Succeeded || result.Tokens is null)
            return TypedResults.Unauthorized();

        RefreshTokenCookies.Set(context.Response, result.Tokens.RefreshToken, jwt);
        return TypedResults.Ok(result.Tokens);
    }

    private static async Task<Results<Ok<AuthTokensDto>, NoContent, UnauthorizedHttpResult>> Refresh(
        [FromBody] RefreshTokenRequest? body,
        [FromServices] ISender sender,
        [FromServices] JwtOptions jwt,
        HttpContext context,
        CancellationToken cancellationToken)
    {
        var refreshToken = FirstNonEmpty(body?.RefreshToken, RefreshTokenCookies.Read(context.Request));
        if (string.IsNullOrWhiteSpace(refreshToken))
            return TypedResults.NoContent();

        var tokens = await sender.Send(new RefreshTokenCommand(refreshToken), cancellationToken);
        if (tokens is null)
            return TypedResults.Unauthorized();

        RefreshTokenCookies.Set(context.Response, tokens.RefreshToken, jwt);
        return TypedResults.Ok(tokens);
    }

    private static async Task<NoContent> Logout(
        [FromBody] RefreshTokenRequest? body,
        [FromServices] ISender sender,
        [FromServices] JwtOptions jwt,
        HttpContext context,
        CancellationToken cancellationToken)
    {
        var refreshToken = FirstNonEmpty(body?.RefreshToken, RefreshTokenCookies.Read(context.Request));
        await sender.Send(new LogoutCommand(refreshToken), cancellationToken);
        RefreshTokenCookies.Delete(context.Response, jwt);
        return TypedResults.NoContent();
    }

    private static async Task<Results<Ok<CurrentUserDto>, NotFound>> Me(
        [FromServices] ISender sender,
        CancellationToken cancellationToken)
    {
        var user = await sender.Send(new GetCurrentUserQuery(), cancellationToken);
        return user is null ? TypedResults.NotFound() : TypedResults.Ok(user);
    }

    private static async Task<NoContent> ForgotPassword(
        [Validate] [FromBody] ForgotPasswordCommand command,
        [FromServices] ISender sender,
        CancellationToken cancellationToken)
    {
        await sender.Send(command, cancellationToken);
        return TypedResults.NoContent();
    }

    private static async Task<Results<NoContent, ValidationProblem>> ResetPassword(
        [Validate] [FromBody] ResetPasswordCommand command,
        [FromServices] ISender sender,
        [FromServices] JwtOptions jwt,
        HttpContext context,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(command, cancellationToken);
        if (!result.Succeeded)
            return TypedResults.ValidationProblem(ToMutableErrors(result.Errors));

        RefreshTokenCookies.Delete(context.Response, jwt);
        return TypedResults.NoContent();
    }

    private static async Task<Results<NoContent, ValidationProblem>> ChangePassword(
        [Validate] [FromBody] ChangePasswordCommand command,
        [FromServices] ISender sender,
        [FromServices] JwtOptions jwt,
        HttpContext context,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(command, cancellationToken);
        if (!result.Succeeded)
            return TypedResults.ValidationProblem(ToMutableErrors(result.Errors));

        RefreshTokenCookies.Delete(context.Response, jwt);
        return TypedResults.NoContent();
    }

    private static Dictionary<string, string[]> ToMutableErrors(IReadOnlyDictionary<string, string[]> errors) =>
        errors.ToDictionary(pair => pair.Key, pair => pair.Value);

    private static string? FirstNonEmpty(params string?[] values) =>
        values.FirstOrDefault(value => !string.IsNullOrWhiteSpace(value));
}

public record RefreshTokenRequest(string? RefreshToken);
