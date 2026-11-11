using PcBuilderBackend.Api.Extensions;
using PcBuilderBackend.Api.Filters;
using PcBuilderBackend.Application.Common.Authorization;

namespace PcBuilderBackend.Api.Endpoints.MasterData;

public static class MasterDataEndpoints
{
    public static void MapMasterDataEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("api/master-data")
            .AddEndpointFilterFactory(ValidationFilter.ValidationFilterFactory)
            .RequireMutationAuthorization(AuthPolicies.MasterDataWrite, AuthPolicies.MasterDataImport)
            .WithDescription("Browse, Read, Edit, Add and Delete master data entities");

        group.MapManufacturerEndpoints();
        group.MapChipsetEndpoints();
        group.MapCpuSeriesEndpoints();
        group.MapGpuSeriesEndpoints();
        group.MapGpuEndpoints();
        group.MapSocketEndpoints();
    }
}
