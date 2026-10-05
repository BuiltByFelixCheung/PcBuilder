using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using PcBuilderBackend.Application.Auth.Dto;
using PcBuilderBackend.Application.Common.Interfaces;
using PcBuilderBackend.Application.Common.Options;
using PcBuilderBackend.Infrastructure.Persistence.Identity;

namespace PcBuilderBackend.Infrastructure.Identity;

public class TokenService(
    ApplicationIdentityDbContext db,
    JwtOptions jwtOptions,
    ILogger<TokenService> logger) : ITokenService
{
    public async Task<AuthTokensDto> IssueTokenPairAsync(CurrentUserDto user, CancellationToken cancellationToken)
    {
        var refreshToken = await CreateRefreshTokenAsync(user.Id, cancellationToken);
        return new AuthTokensDto(
            CreateAccessToken(user),
            refreshToken,
            jwtOptions.AccessTokenMinutes * 60,
            user);
    }

    public async Task<AuthTokensDto?> RotateAsync(string refreshToken, CancellationToken cancellationToken)
    {
        var tokenHash = Hash(refreshToken);
        var existing = await db.RefreshTokens
            .SingleOrDefaultAsync(token => token.TokenHash == tokenHash, cancellationToken);

        if (existing is null)
            return null;

        if (existing.RevokedAtUtc is not null)
        {
            IdentityLog.RefreshTokenReuse(logger, existing.UserId);
            await RevokeFamilyAsync(existing.UserId, cancellationToken);
            return null;
        }

        if (existing.ExpiresAtUtc <= DateTime.UtcNow)
        {
            existing.RevokedAtUtc = DateTime.UtcNow;
            await db.SaveChangesAsync(cancellationToken);
            return null;
        }

        var user = await db.Users.SingleOrDefaultAsync(u => u.Id == existing.UserId, cancellationToken);
        if (user is null)
            return null;

        var userDto = await MapUserAsync(user, cancellationToken);
        var rawReplacement = CreateRawRefreshToken();
        var replacement = new RefreshToken
        {
            UserId = existing.UserId,
            TokenHash = Hash(rawReplacement),
            CreatedAtUtc = DateTime.UtcNow,
            ExpiresAtUtc = DateTime.UtcNow.AddDays(jwtOptions.RefreshTokenDays)
        };

        existing.RevokedAtUtc = DateTime.UtcNow;
        existing.ReplacedByTokenId = replacement.Id;
        db.RefreshTokens.Add(replacement);
        await db.SaveChangesAsync(cancellationToken);

        return new AuthTokensDto(
            CreateAccessToken(userDto),
            rawReplacement,
            jwtOptions.AccessTokenMinutes * 60,
            userDto);
    }

    public async Task RevokeAsync(string refreshToken, CancellationToken cancellationToken)
    {
        var tokenHash = Hash(refreshToken);
        var existing = await db.RefreshTokens
            .SingleOrDefaultAsync(token => token.TokenHash == tokenHash, cancellationToken);

        if (existing is null || existing.RevokedAtUtc is not null)
            return;

        existing.RevokedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
    }

    public Task RevokeAllForUserAsync(Guid userId, CancellationToken cancellationToken) =>
        RevokeFamilyAsync(userId, cancellationToken);

    private async Task RevokeFamilyAsync(Guid userId, CancellationToken cancellationToken)
    {
        var active = await db.RefreshTokens
            .Where(token => token.UserId == userId && token.RevokedAtUtc == null)
            .ToListAsync(cancellationToken);

        var now = DateTime.UtcNow;
        foreach (var token in active)
            token.RevokedAtUtc = now;

        await db.SaveChangesAsync(cancellationToken);
    }

    private async Task<string> CreateRefreshTokenAsync(Guid userId, CancellationToken cancellationToken)
    {
        var raw = CreateRawRefreshToken();
        db.RefreshTokens.Add(new RefreshToken
        {
            UserId = userId,
            TokenHash = Hash(raw),
            CreatedAtUtc = DateTime.UtcNow,
            ExpiresAtUtc = DateTime.UtcNow.AddDays(jwtOptions.RefreshTokenDays)
        });
        await db.SaveChangesAsync(cancellationToken);
        return raw;
    }

    private string CreateAccessToken(CurrentUserDto user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.Key));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expires = DateTime.UtcNow.AddMinutes(jwtOptions.AccessTokenMinutes);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new(ClaimTypes.Email, user.Email),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new("user_name", user.UserName)
        };
        claims.AddRange(user.Roles.Select(role => new Claim(ClaimTypes.Role, role)));

        var token = new JwtSecurityToken(
            issuer: jwtOptions.Issuer,
            audience: jwtOptions.Audience,
            claims: claims,
            expires: expires,
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private async Task<CurrentUserDto> MapUserAsync(ApplicationUser user, CancellationToken cancellationToken)
    {
        var roles = await db.UserRoles
            .Where(userRole => userRole.UserId == user.Id)
            .Join(db.Roles, userRole => userRole.RoleId, role => role.Id, (_, role) => role.Name!)
            .ToListAsync(cancellationToken);

        return new CurrentUserDto(user.Id, user.Email!, user.UserName!, roles);
    }

    private static string CreateRawRefreshToken() => Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));

    private static string Hash(string value)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(value));
        return Convert.ToHexString(bytes);
    }
}
