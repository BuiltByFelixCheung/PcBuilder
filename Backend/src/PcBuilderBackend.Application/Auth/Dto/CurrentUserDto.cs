namespace PcBuilderBackend.Application.Auth.Dto;

public record CurrentUserDto(
    Guid Id,
    string Email,
    string UserName,
    IReadOnlyList<string> Roles);
