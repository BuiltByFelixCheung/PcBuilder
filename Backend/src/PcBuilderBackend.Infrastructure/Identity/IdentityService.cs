using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using PcBuilderBackend.Application.Auth.Dto;
using PcBuilderBackend.Application.Common.Authorization;
using PcBuilderBackend.Application.Common.Interfaces;
using PcBuilderBackend.Infrastructure.Persistence.Identity;

namespace PcBuilderBackend.Infrastructure.Identity;

public class IdentityService(
    UserManager<ApplicationUser> userManager,
    ILogger<IdentityService> logger) : IIdentityService
{
    public async Task<RegisterResultDto> RegisterMemberAsync(
        string email,
        string password,
        string userName,
        CancellationToken cancellationToken)
    {
        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = userName.Trim(),
            Email = email
        };

        var createResult = await userManager.CreateAsync(user, password);
        if (!createResult.Succeeded)
            return new RegisterResultDto(false, null, ToErrors(createResult));

        var roleResult = await userManager.AddToRoleAsync(user, AuthRoles.Member);
        if (!roleResult.Succeeded)
            return new RegisterResultDto(false, null, ToErrors(roleResult));

        IdentityLog.Registered(logger, user.Id, user.Email ?? string.Empty);
        return new RegisterResultDto(true, await MapAsync(user), new Dictionary<string, string[]>());
    }

    public async Task<PasswordSignInResultDto> PasswordSignInAsync(
        string email,
        string password,
        CancellationToken cancellationToken)
    {
        var user = await userManager.FindByEmailAsync(email);
        if (user is null)
        {
            IdentityLog.SignInFailed(logger, email);
            return new PasswordSignInResultDto(false, false, null);
        }

        if (await userManager.IsLockedOutAsync(user))
        {
            IdentityLog.SignInLockedOut(logger, email);
            return new PasswordSignInResultDto(false, true, null);
        }

        if (!await userManager.CheckPasswordAsync(user, password))
        {
            await userManager.AccessFailedAsync(user);
            if (await userManager.IsLockedOutAsync(user))
            {
                IdentityLog.SignInLockedOut(logger, email);
                return new PasswordSignInResultDto(false, true, null);
            }

            IdentityLog.SignInFailed(logger, email);
            return new PasswordSignInResultDto(false, false, null);
        }

        await userManager.ResetAccessFailedCountAsync(user);
        IdentityLog.SignedIn(logger, user.Id);
        return new PasswordSignInResultDto(true, false, await MapAsync(user));
    }

    public async Task<CurrentUserDto?> GetUserAsync(Guid userId, CancellationToken cancellationToken)
    {
        var user = await userManager.FindByIdAsync(userId.ToString());
        return user is null ? null : await MapAsync(user);
    }

    public async Task<PasswordResetTokenDto?> GeneratePasswordResetTokenAsync(
        string email,
        CancellationToken cancellationToken)
    {
        var user = await userManager.FindByEmailAsync(email);
        if (user is null)
        {
            IdentityLog.PasswordResetUnknownEmail(logger, email);
            return null;
        }

        var token = await userManager.GeneratePasswordResetTokenAsync(user);
        IdentityLog.PasswordResetRequested(logger, user.Id);
        return new PasswordResetTokenDto(user.Id, user.Email!, token);
    }

    public async Task<IdentityOperationResultDto> ResetPasswordAsync(
        string email,
        string token,
        string newPassword,
        CancellationToken cancellationToken)
    {
        var user = await userManager.FindByEmailAsync(email);
        if (user is null)
        {
            IdentityLog.PasswordResetFailed(logger, email);
            return Failed("token", "The password reset link is invalid or has expired.");
        }

        var result = await userManager.ResetPasswordAsync(user, token, newPassword);
        if (!result.Succeeded)
        {
            IdentityLog.PasswordResetFailed(logger, email);
            return new IdentityOperationResultDto(false, user.Id, ToErrors(result));
        }

        await userManager.ResetAccessFailedCountAsync(user);
        await userManager.SetLockoutEndDateAsync(user, null);
        IdentityLog.PasswordResetCompleted(logger, user.Id);
        return new IdentityOperationResultDto(true, user.Id, EmptyErrors());
    }

    public async Task<IdentityOperationResultDto> ChangePasswordAsync(
        Guid userId,
        string currentPassword,
        string newPassword,
        CancellationToken cancellationToken)
    {
        var user = await userManager.FindByIdAsync(userId.ToString());
        if (user is null)
            return Failed("identity", "User was not found.");

        var result = await userManager.ChangePasswordAsync(user, currentPassword, newPassword);
        if (!result.Succeeded)
            return new IdentityOperationResultDto(false, user.Id, ToErrors(result));

        IdentityLog.PasswordChanged(logger, user.Id);
        return new IdentityOperationResultDto(true, user.Id, EmptyErrors());
    }

    private async Task<CurrentUserDto> MapAsync(ApplicationUser user)
    {
        var roles = await userManager.GetRolesAsync(user);
        return new CurrentUserDto(user.Id, user.Email!, user.UserName!, roles.ToList());
    }

    private static Dictionary<string, string[]> ToErrors(IdentityResult result)
    {
        return result.Errors
            .GroupBy(error => error.Code switch
            {
                "DuplicateEmail" or "InvalidEmail" => "email",
                "DuplicateUserName" or "InvalidUserName" => "userName",
                "InvalidToken" => "token",
                _ when error.Code.Contains("Password", StringComparison.OrdinalIgnoreCase) => "password",
                _ => "identity"
            })
            .ToDictionary(group => group.Key, group => group.Select(error => error.Description).ToArray());
    }

    private static IdentityOperationResultDto Failed(string key, string message) =>
        new(false, null, new Dictionary<string, string[]> { [key] = [message] });

    private static Dictionary<string, string[]> EmptyErrors() => [];
}
