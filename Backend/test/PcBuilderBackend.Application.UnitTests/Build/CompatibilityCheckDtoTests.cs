using FluentAssertions;
using PcBuilderBackend.Application.Build;
using PcBuilderBackend.Application.Build.Dto;
using PcBuilderBackend.Application.Build.Queries;
using PcBuilderBackend.Domain.Enums;
using PcBuilderBackend.Domain.ValueObjects;

namespace PcBuilderBackend.Application.UnitTests.Build;

public class CompatibilityCheckDtoTests
{
    [Fact]
    public void Empty_checks_are_compatible_with_no_issues()
    {
        var dto = CompatibilityCheckDto.From([]);

        dto.Status.Should().Be(PartsCompatibility.Compatible);
        dto.Issues.Should().BeEmpty();
    }

    [Fact]
    public void Compatible_rows_are_dropped_and_overall_status_is_the_worst()
    {
        var motherboardId = Guid.NewGuid();
        var graphicsCardId = Guid.NewGuid();

        var dto = CompatibilityCheckDto.From(
        [
            new CompatibilityCheck(
                PartsCompatibilityResult.Compatible(),
                [new CompatibilityPartRef(CompatibilitySlot.Chassis, Guid.NewGuid())]),
            new CompatibilityCheck(
                PartsCompatibilityResult.CompatibleReduced(
                    CompatibilityReason.PcieGenerationReduced,
                    PcieGeneration.Gen5,
                    PcieGeneration.Gen4),
                [
                    new CompatibilityPartRef(CompatibilitySlot.Motherboard, motherboardId),
                    new CompatibilityPartRef(CompatibilitySlot.GraphicsCard, graphicsCardId)
                ]),
            new CompatibilityCheck(
                PartsCompatibilityResult.Incompatible(CompatibilityReason.SocketMismatch),
                [
                    new CompatibilityPartRef(CompatibilitySlot.Motherboard, motherboardId),
                    new CompatibilityPartRef(CompatibilitySlot.Cpu, Guid.NewGuid())
                ])
        ]);

        dto.Status.Should().Be(PartsCompatibility.Incompatible);
        dto.Issues.Should().HaveCount(2);

        var reduced = dto.Issues.Should().ContainSingle(i => i.Reason == CompatibilityReason.PcieGenerationReduced)
            .Subject;
        reduced.Status.Should().Be(PartsCompatibility.CompatibleReduced);
        reduced.Rated.Should().Be(nameof(PcieGeneration.Gen5));
        reduced.Executing.Should().Be(nameof(PcieGeneration.Gen4));
        reduced.Facts.Should().ContainSingle(fact =>
            fact.Aspect == CompatibilityAspect.PcieGeneration
            && fact.Limit == nameof(PcieGeneration.Gen4)
            && fact.Actual == nameof(PcieGeneration.Gen5));
        reduced.Parts.Should().Contain(p => p.Slot == CompatibilitySlot.GraphicsCard && p.PartId == graphicsCardId);
        reduced.Parts.Should().NotContain(p => p.Slot.ToString().Contains("Gpu"));
    }

    [Fact]
    public async Task Handler_maps_checker_output()
    {
        var motherboardId = Guid.NewGuid();
        var driveId = Guid.NewGuid();
        var checker = new StubChecker(
        [
            new CompatibilityCheck(
                PartsCompatibilityResult.Incompatible(CompatibilityReason.InsufficientSataPorts),
                [
                    new CompatibilityPartRef(CompatibilitySlot.Motherboard, motherboardId),
                    new CompatibilityPartRef(CompatibilitySlot.StorageDevices, driveId)
                ])
        ]);

        var handler = new CheckPcBuildCompatibilityHandler(checker);
        var dto = await handler.Handle(
            new CheckPcBuildCompatibilityQuery(
                null, motherboardId, null, null, null, null, null, [], [], [], []),
            CancellationToken.None);

        dto.Status.Should().Be(PartsCompatibility.Incompatible);
        dto.Issues.Should().ContainSingle(i =>
            i.Reason == CompatibilityReason.InsufficientSataPorts
            && i.Parts.Any(p => p.Slot == CompatibilitySlot.StorageDevices && p.PartId == driveId));
    }

    private sealed class StubChecker(List<CompatibilityCheck> checks) : ICompatibilityChecker
    {
        public Task<List<CompatibilityCheck>> CheckCompatibilityAsync(CompatibilityCheckRequest request) =>
            Task.FromResult(checks);
    }
}
