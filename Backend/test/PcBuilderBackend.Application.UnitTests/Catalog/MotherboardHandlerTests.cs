using FluentAssertions;
using NSubstitute;
using PcBuilderBackend.Application.Catalog.Motherboards;
using PcBuilderBackend.Application.Catalog.Motherboards.Dto;
using PcBuilderBackend.Application.Catalog.Motherboards.Queries;
using PcBuilderBackend.Application.Common.Dto;

namespace PcBuilderBackend.Application.UnitTests.Catalog;

public class MotherboardHandlerTests
{
    [Fact]
    public async Task Query_handlers_delegate_to_read_store()
    {
        var store = Substitute.For<IMotherboardReadStore>();
        var list = PagedResult<MotherboardListItemDto>.Empty(0, 10);
        var request = new PagedRequest();
        var filter = new PagedRequest<MotherboardFilter>(new MotherboardFilter());
        var motherboard = new MotherboardDto { Id = Guid.NewGuid(), Name = "X" };
        var pcie = new List<MotherboardPcieDto>();
        var m2 = new List<MotherboardM2Dto>();
        var usb = new List<MotherboardUsbDto>();

        store.ListAsync(request, Arg.Any<CancellationToken>()).Returns(list);
        store.FilterAsync(filter, Arg.Any<CancellationToken>()).Returns(list);
        store.GetByIdAsync(motherboard.Id, Arg.Any<CancellationToken>()).Returns(motherboard);
        store.ListPcieSlotsAsync(motherboard.Id, Arg.Any<CancellationToken>()).Returns(pcie);
        store.ListM2SlotsAsync(motherboard.Id, Arg.Any<CancellationToken>()).Returns(m2);
        store.ListUsbPortsAsync(motherboard.Id, Arg.Any<CancellationToken>()).Returns(usb);

        (await new GetMotherboardsHandler(store).Handle(new GetMotherboardsQuery(request), CancellationToken.None))
            .Should().BeSameAs(list);
        (await new FilterMotherboardsHandler(store).Handle(new FilterMotherboardsQuery(filter), CancellationToken.None))
            .Should().BeSameAs(list);
        (await new GetMotherboardByIdHandler(store)
            .Handle(new GetMotherboardByIdQuery(motherboard.Id), CancellationToken.None))
            .Should().BeSameAs(motherboard);
        (await new GetMotherboardPcieSlotsByMotherboardIdHandler(store)
            .Handle(new GetMotherboardPcieSlotsByMotherboardIdQuery(motherboard.Id), CancellationToken.None))
            .Should().BeSameAs(pcie);
        (await new GetMotherboardM2SlotsByMotherboardIdHandler(store)
            .Handle(new GetMotherboardM2SlotsByMotherboardIdQuery(motherboard.Id), CancellationToken.None))
            .Should().BeSameAs(m2);
        (await new GetMotherboardUsbPortsByMotherboardIdHandler(store)
            .Handle(new GetMotherboardUsbPortsByMotherboardIdQuery(motherboard.Id), CancellationToken.None))
            .Should().BeSameAs(usb);
    }
}
