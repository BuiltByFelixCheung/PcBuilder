using PcBuilderBackend.Application.Auth.Dto;

namespace PcBuilderBackend.Application.Common.Interfaces;

public interface IIdentityService
{
    Task<RegisterResultDto> RegisterMemberAsync(
        string email,
        string password,
        string userName,
        CancellationToken cancellationToken);

    Task<PasswordSignInResultDto> PasswordSignInAsync(
        string email,
        string password,
        CancellationToken cancellationToken);

    Task<CurrentUserDto?> GetUserAsync(Guid userId, CancellationToken cancellationToken);

    Task<PasswordResetTokenDto?> GeneratePasswordResetTokenAsync(
        string email,
        CancellationToken cancellationToken);

    Task<IdentityOperationResultDto> ResetPasswordAsync(
        string email,
        string token,
        string newPassword,
        CancellationToken cancellationToken);

    Task<IdentityOperationResultDto> ChangePasswordAsync(
        Guid userId,
        string currentPassword,
        string newPassword,
        CancellationToken cancellationToken);
}

public record PasswordSignInResultDto(
    bool Succeeded,
    bool IsLockedOut,
    CurrentUserDto? User);
