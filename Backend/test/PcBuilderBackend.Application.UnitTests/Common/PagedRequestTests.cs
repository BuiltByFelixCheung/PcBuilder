using System.Text.Json;
using System.Text.Json.Serialization;
using FluentAssertions;
using PcBuilderBackend.Application.Catalog.Chassis.Dto;
using PcBuilderBackend.Application.Catalog.Motherboards.Dto;
using PcBuilderBackend.Application.Common.Dto;
using PcBuilderBackend.Domain.Enums;

namespace PcBuilderBackend.Application.UnitTests.Common;

public class PagedRequestTests
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    [Fact]
    public void Json_body_without_filter_deserializes_filter_as_null()
    {
        var request = JsonSerializer.Deserialize<PagedRequest<MotherboardFilter>>(
            """{"pageIndex":0,"pageSize":10}""",
            JsonOptions);

        request.Should().NotBeNull();
        request!.Filter.Should().BeNull();
        (request.Filter ?? new MotherboardFilter()).Name.Should().BeEmpty();
    }

    [Fact]
    public void Json_body_with_filter_deserializes_properties()
    {
        var request = JsonSerializer.Deserialize<PagedRequest<MotherboardFilter>>(
            """{"filter":{"name":"B650"},"pageIndex":0,"pageSize":10}""",
            JsonOptions);

        request!.Filter.Should().NotBeNull();
        request.Filter!.Name.Should().Be("B650");
    }

    [Fact]
    public void Http_json_binds_max_supported_mb_form_factor()
    {
        var options = new JsonSerializerOptions(JsonSerializerDefaults.Web);
        options.Converters.Add(new JsonStringEnumConverter());

        var request = JsonSerializer.Deserialize<PagedRequest<ChassisFilter>>(
            """{"pageIndex":0,"pageSize":10,"sortBy":"name","sortDirection":"asc","filter":{"maxSupportedMbFormFactor":"Mitx"}}""",
            options);

        request.Should().NotBeNull();
        request!.Filter.Should().NotBeNull();
        request.Filter!.MaxSupportedMbFormFactor.Should().Be(MbFormFactor.Mitx);
    }
}
