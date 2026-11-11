using PcBuilderBackend.Api.Extensions;
using PcBuilderBackend.Api.Filters;
using PcBuilderBackend.Application.Common.Authorization;

namespace PcBuilderBackend.Api.Endpoints.Catalog;

public static class CatalogEndpoints
{
    public static void MapCatalogEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("api/catalog")
            .AddEndpointFilterFactory(ValidationFilter.ValidationFilterFactory)
            .RequireMutationAuthorization(AuthPolicies.CatalogWrite, AuthPolicies.CatalogImport)
            .WithDescription("Browse, Read, Edit, Add and Delete products in catalog");

        group.MapChassisEndpoints();
        group.MapChassisFanEndpoints();
        group.MapMotherboardEndpoints();
        group.MapCpuEndpoints();
        group.MapMemoryEndpoints();
        group.MapGraphicsCardEndpoints();
        group.MapPsuEndpoints();
        group.MapCpuCoolerEndpoints();
        group.MapStorageDriveEndpoints();
        group.MapWiredNetworkAdapterEndpoints();
        group.MapWirelessNetworkAdapterEndpoints();
        group.MapProductPictureEndpoints();
    }
}