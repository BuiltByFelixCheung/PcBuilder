using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using PcBuilderBackend.Application.Catalog.Chassis;
using PcBuilderBackend.Application.Catalog.ChassisFans;
using PcBuilderBackend.Application.Catalog.CpuCoolers;
using PcBuilderBackend.Application.Catalog.Cpus;
using PcBuilderBackend.Application.Catalog.GraphicsCards;
using PcBuilderBackend.Application.Catalog.Memories;
using PcBuilderBackend.Application.Catalog.Motherboards;
using PcBuilderBackend.Application.Catalog.Psus;
using PcBuilderBackend.Application.Catalog.StorageDrives;
using PcBuilderBackend.Application.Catalog.WiredNetworkAdapters;
using PcBuilderBackend.Application.Catalog.WirelessNetworkAdapters;
using PcBuilderBackend.Application.Build;
using PcBuilderBackend.Application.Common.Interfaces;
using PcBuilderBackend.Application.Common.Options;
using PcBuilderBackend.Application.MasterData.Chipsets.Dto;
using PcBuilderBackend.Application.MasterData.CpuSeries.Dto;
using PcBuilderBackend.Application.MasterData.Gpus.Dto;
using PcBuilderBackend.Application.MasterData.GpuSeries.Dto;
using PcBuilderBackend.Application.MasterData.Manufacturers;
using PcBuilderBackend.Application.MasterData.Manufacturers.Dto;
using PcBuilderBackend.Application.MasterData.Sockets.Dto;
using PcBuilderBackend.Domain.Entities;
using PcBuilderBackend.Infrastructure.Caching;
using PcBuilderBackend.Infrastructure.Identity;
using PcBuilderBackend.Infrastructure.Persistence;
using PcBuilderBackend.Infrastructure.Persistence.Identity;
using PcBuilderBackend.Infrastructure.Persistence.Queries;
using PcBuilderBackend.Infrastructure.Persistence.Repositories;
using PcBuilderBackend.Infrastructure.Services;
using StackExchange.Redis;

namespace PcBuilderBackend.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string 'DefaultConnection' was not found.");
        var identityConnectionString = configuration.GetConnectionString("IdentityConnection")
            ?? throw new InvalidOperationException("Connection string 'IdentityConnection' was not found.");

        services.AddDbContext<PcBuilderDbContext>(options =>
            options.UseNpgsql(connectionString, npgsql => npgsql.MapDomainEnums()));

        services.AddDbContext<ApplicationIdentityDbContext>(options =>
            options.UseNpgsql(identityConnectionString, npgsql =>
                npgsql.MigrationsHistoryTable("__EFMigrationsHistory", "identity")));

        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped<IActiveEntityLookup, ActiveEntityLookup>();
        services.AddScoped(typeof(IRepository<>), typeof(EfRepository<>));
        services.AddScoped<IReadStore<ManufacturerDto>, EfReadStore<Manufacturer, ManufacturerDto>>();
        services.AddScoped<IReadStore<SocketDto>, EfReadStore<Socket, SocketDto>>();
        services.AddScoped<IReadStore<ChipsetDto>, EfReadStore<Chipset, ChipsetDto>>();
        services.AddScoped<IReadStore<CpuSeriesDto>, EfReadStore<CpuSeries, CpuSeriesDto>>();
        services.AddScoped<IReadStore<GpuDto>, EfReadStore<Gpu, GpuDto>>();
        services.AddScoped<IReadStore<GpuSeriesDto>, EfReadStore<GpuSeries, GpuSeriesDto>>();

        // Read Stores
        services.AddScoped<IManufacturerReadStore, ManufacturerReadStore>();
        services.AddScoped<IChassisReadStore, ChassisReadStore>();
        services.AddScoped<IChassisFanReadStore, ChassisFanReadStore>();
        services.AddScoped<ICpuReadStore, CpuReadStore>();
        services.AddScoped<ICpuCoolerReadStore, CpuCoolerReadStore>();
        services.AddScoped<IMotherboardReadStore, MotherboardReadStore>();
        services.AddScoped<IRamReadStore, RamReadStore>();
        services.AddScoped<IGraphicsCardReadStore, GraphicsCardReadStore>();
        services.AddScoped<IPsuReadStore, PsuReadStore>();
        services.AddScoped<IStorageDriveReadStore, StorageDriveReadStore>();
        services.AddScoped<IWiredNetworkAdapterReadStore, WiredNetworkAdapterReadStore>();
        services.AddScoped<IWirelessNetworkAdapterReadStore, WirelessNetworkAdapterReadStore>();

        // Repositories
        services.AddScoped<IChassisRepository, ChassisRepository>();
        services.AddScoped<ICpuRepository, CpuRepository>();
        services.AddScoped<ICpuCoolerRepository, CpuCoolerRepository>();
        services.AddScoped<IMotherboardRepository, MotherboardRepository>();
        services.AddScoped<IRamRepository, RamRepository>();
        services.AddScoped<IGraphicsCardRepository, GraphicsCardRepository>();
        services.AddScoped<IPsuRepository, PsuRepository>();
        services.AddScoped<IChassisFanRepository, ChassisFanRepository>();
        services.AddScoped<IStorageDriveRepository, StorageDriveRepository>();
        services.AddScoped<IWiredNetworkAdapterRepository, WiredNetworkAdapterRepository>();
        services.AddScoped<IWirelessNetworkAdapterRepository, WirelessNetworkAdapterRepository>();

        services.AddScoped<ICatalogRepository, CatalogRepository>();
        services.AddScoped<IPcBuildRepository, PcBuildRepository>();
        services.AddScoped<IPcBuildReadStore, PcBuildReadStore>();

        services.AddScoped<IExcelImportService, ClosedXmlExcelImportService>();

        services.AddScoped<IStorageService, StorageService>();
        
        AddIdentity(services);
        AddJwt(services, configuration);
        AddEmail(services, configuration);
        AddAppOptions(services, configuration);
        AddRedisCache(services, configuration);

        return services;
    }

    private static void AddIdentity(IServiceCollection services)
    {
        services
            .AddIdentityCore<ApplicationUser>(options =>
            {
                options.User.RequireUniqueEmail = true;
                options.User.AllowedUserNameCharacters =
                    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._";
                options.Password.RequiredLength = 10;
                options.Lockout.AllowedForNewUsers = true;
                options.Lockout.MaxFailedAccessAttempts = 5;
                options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
            })
            .AddRoles<ApplicationRole>()
            .AddEntityFrameworkStores<ApplicationIdentityDbContext>()
            .AddDefaultTokenProviders();

        services.Configure<DataProtectionTokenProviderOptions>(options =>
            options.TokenLifespan = TimeSpan.FromHours(1));

        services.AddScoped<IIdentityService, IdentityService>();
        services.AddScoped<ITokenService, TokenService>();
    }

    private static void AddJwt(IServiceCollection services, IConfiguration configuration)
    {
        var jwt = configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>()
            ?? throw new InvalidOperationException("Jwt configuration section is missing.");
        jwt.Validate();
        services.AddSingleton(jwt);
    }

    private static void AddEmail(IServiceCollection services, IConfiguration configuration)
    {
        var smtp = configuration.GetSection(SmtpOptions.SectionName).Get<SmtpOptions>()
            ?? throw new InvalidOperationException("Smtp configuration section is missing.");
        smtp.Validate();
        services.AddSingleton(smtp);
        services.AddSingleton<IEmailSender, SmtpEmailSender>();
    }

    private static void AddAppOptions(IServiceCollection services, IConfiguration configuration)
    {
        var app = configuration.GetSection(AppOptions.SectionName).Get<AppOptions>() ?? new AppOptions();
        services.AddSingleton(app);
    }

    private static void AddRedisCache(IServiceCollection services, IConfiguration configuration)
    {
        var redisConnection =
            configuration.GetConnectionString("Redis")
            ?? configuration["Redis:Configuration"]
            ?? "localhost:6379";

        services.AddSingleton<IConnectionMultiplexer>(_ =>
            ConnectionMultiplexer.Connect(redisConnection));

        services.AddStackExchangeRedisCache(options =>
        {
            options.Configuration = redisConnection;
            options.InstanceName = "PcBuilder:";
        });

        services.AddSingleton<ICacheService, RedisCacheService>();
    }
}
