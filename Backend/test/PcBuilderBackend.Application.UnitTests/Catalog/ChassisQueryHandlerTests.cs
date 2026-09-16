using FluentAssertions;
using NSubstitute;
using PcBuilderBackend.Application.Catalog.Chassis;
using PcBuilderBackend.Application.Catalog.Chassis.Dto;
using PcBuilderBackend.Application.Catalog.Chassis.Queries;
using PcBuilderBackend.Application.Common.Dto;
using PcBuilderBackend.Domain.Enums;

namespace PcBuilderBackend.Application.UnitTests.Catalog;

public class ChassisQueryHandlerTests
{
    [Fact]
    public async Task Query_handlers_delegate_to_read_store()
    {
        var store = Substitute.For<IChassisReadStore>();
        var list = PagedResult<ChassisListItemDto>.Empty(0, 10);
        var request = new PagedRequest();
        var filter = new PagedRequest<ChassisFilter>(new ChassisFilter());
        var chassis = new ChassisDto { Id = Guid.NewGuid(), Name = "4000D" };
        var bays = new List<ChassisDriveBayDto>();
        var mounts = new List<ChassisFanMountDto>();
        var pcie = new List<ChassisPcieSlotDto>();
        var radiators = new List<ChassisRadiatorDto>();
        var mb = new List<MbFormFactor> { MbFormFactor.Atx };
        var psu = new List<PsuFormFactor> { PsuFormFactor.Atx };

        store.ListAsync(request, Arg.Any<CancellationToken>()).Returns(list);
        store.FilterAsync(filter, Arg.Any<CancellationToken>()).Returns(list);
        store.GetByIdAsync(chassis.Id, Arg.Any<CancellationToken>()).Returns(chassis);
        store.ListDriveBaysAsync(chassis.Id, Arg.Any<CancellationToken>()).Returns(bays);
        store.ListFanMountsAsync(chassis.Id, Arg.Any<CancellationToken>()).Returns(mounts);
        store.ListPcieSlotsAsync(chassis.Id, Arg.Any<CancellationToken>()).Returns(pcie);
        store.ListRadiatorsAsync(chassis.Id, Arg.Any<CancellationToken>()).Returns(radiators);
        store.ListMbFormFactorsAsync(chassis.Id, Arg.Any<CancellationToken>()).Returns(mb);
        store.ListPsuFormFactorsAsync(chassis.Id, Arg.Any<CancellationToken>()).Returns(psu);

        (await new GetChassisHandler(store).Handle(new GetChassisQuery(request), CancellationToken.None))
            .Should().BeSameAs(list);
        (await new FilterChassisHandler(store).Handle(new FilterChassisQuery(filter), CancellationToken.None))
            .Should().BeSameAs(list);
        (await new GetChassisByIdHandler(store).Handle(new GetChassisByIdQuery(chassis.Id), CancellationToken.None))
            .Should().BeSameAs(chassis);
        (await new GetChassisDriveBaysByChassisIdHandler(store)
            .Handle(new GetChassisDriveBaysByChassisIdQuery(chassis.Id), CancellationToken.None))
            .Should().BeSameAs(bays);
        (await new GetChassisFanMountsByChassisIdHandler(store)
            .Handle(new GetChassisFanMountsByChassisIdQuery(chassis.Id), CancellationToken.None))
            .Should().BeSameAs(mounts);
        (await new GetChassisPcieSlotsByChassisIdHandler(store)
            .Handle(new GetChassisPcieSlotsByChassisIdQuery(chassis.Id), CancellationToken.None))
            .Should().BeSameAs(pcie);
        (await new GetChassisRadiatorsByChassisIdHandler(store)
            .Handle(new GetChassisRadiatorsByChassisIdQuery(chassis.Id), CancellationToken.None))
            .Should().BeSameAs(radiators);
        (await new GetChassisMbFormFactorsByChassisIdHandler(store)
            .Handle(new GetChassisMbFormFactorsByChassisIdQuery(chassis.Id), CancellationToken.None))
            .Should().BeSameAs(mb);
        (await new GetChassisPsuFormFactorsByChassisIdHandler(store)
            .Handle(new GetChassisPsuFormFactorsByChassisIdQuery(chassis.Id), CancellationToken.None))
            .Should().BeSameAs(psu);
    }
}
