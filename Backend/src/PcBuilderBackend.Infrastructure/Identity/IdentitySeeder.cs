using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using PcBuilderBackend.Application.Common.Authorization;
using PcBuilderBackend.Infrastructure.Persistence.Identity;

namespace PcBuilderBackend.Infrastructure.Identity;

public static class IdentitySeeder
{
    public static async Task SeedAsync(
        ApplicationIdentityDbContext db,
        RoleManager<ApplicationRole> roleManager,
        UserManager<ApplicationUser> userManager,
        IConfiguration configuration,
        ILogger logger,
        CancellationToken cancellationToken)
    {
        await db.Database.MigrateAsync(cancellationToken);

        foreach (var roleName in new[] { AuthRoles.Admin, AuthRoles.Member })
        {
            if (!await roleManager.RoleExistsAsync(roleName))
                await roleManager.CreateAsync(new ApplicationRole { Name = roleName });
        }

        IdentityLog.RolesSeeded(logger);

        var email = configuration["Admin:Email"];
        var password = configuration["Admin:Password"];
        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
        {
            IdentityLog.AdminSeedSkipped(logger);
            return;
        }

        var admin = await userManager.FindByEmailAsync(email);
        if (admin is null)
        {
            admin = new ApplicationUser
            {
                Id = Guid.NewGuid(),
                UserName = "admin",
                Email = email,
                EmailConfirmed = true
            };

            var createResult = await userManager.CreateAsync(admin, password);
            if (!createResult.Succeeded)
            {
                IdentityLog.AdminSeedFailed(
                    logger,
                    email,
                    string.Join("; ", createResult.Errors.Select(error => error.Description)));
                return;
            }
        }

        if (!await userManager.IsInRoleAsync(admin, AuthRoles.Admin))
            await userManager.AddToRoleAsync(admin, AuthRoles.Admin);

        IdentityLog.AdminSeeded(logger, email);
    }
}
