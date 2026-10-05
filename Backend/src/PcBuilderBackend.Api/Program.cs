using System.Text.Json.Serialization;
using InfisicalConfiguration;
using Microsoft.AspNetCore.HttpOverrides;
using PcBuilderBackend.Api.Endpoints.Auth;
using PcBuilderBackend.Api.Endpoints.Build;
using PcBuilderBackend.Api.Endpoints.Catalog;
using PcBuilderBackend.Api.Endpoints.MasterData;
using PcBuilderBackend.Api.ExceptionHandling;
using PcBuilderBackend.Api.Extensions;
using PcBuilderBackend.Application;
using PcBuilderBackend.Infrastructure;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

var envSlug = builder.Environment.EnvironmentName switch
{
    "Development" => "dev",
    "Production" => "prod",
    "Staging" => "staging",
    _ => throw new InvalidOperationException()
};

builder.Configuration.AddInfisical(
    new InfisicalConfigBuilder()
        .SetInfisicalUrl(builder.Configuration["Infisical:Url"] ?? "")
        .SetProjectId(builder.Configuration["Infisical:ProjectId"] ?? "")
        .SetEnvironment(envSlug)
        .SetAuth(new InfisicalAuthBuilder()
            .SetUniversalAuth(
                builder.Configuration["Infisical:ClientId"] ?? "",
                builder.Configuration["Infisical:ClientSecret"] ?? "")
            .Build()
        ).Build()
).Build();

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
});
builder.Services.AddOpenApi(options =>
{
    options.AutoDiscoverSidebarGroups();
    options.AddJwtBearerSecurity();
});
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddApplication(builder.Configuration);
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddApiAuthentication(builder.Configuration);
builder.Services.AddAntiforgery();
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders =
        ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownIPNetworks.Clear();
    options.KnownProxies.Clear();
});

var app = builder.Build();

// Configure the HTTP request pipeline.
app.UseExceptionHandler();
app.UseForwardedHeaders();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

app.UseHttpsRedirection();
app.UseDefaultFiles();
app.UseStaticFiles();
app.UseAuthentication();
app.UseAuthorization();
app.UseAntiforgery();

app.MapCatalogEndpoints();
app.MapMasterDataEndpoints();
app.MapAuthEndpoints();
app.MapPcBuildEndpoints();
app.MapSpaFallback();

await app.SeedIdentityAsync();
await app.RunAsync();
