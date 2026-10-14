using FluentAssertions;
using PcBuilderBackend.Domain.Entities;
using PcBuilderBackend.Domain.Enums;
using PcBuilderBackend.Domain.ValueObjects;

namespace PcBuilderBackend.Domain.UnitTests.Catalog;

public class MotherboardFanHeaderTests
{
    private static readonly Guid ManufacturerId = Guid.NewGuid();

    [Fact]
    public void Daisy_chain_pack_consumes_one_header_when_max_covers_pack()
    {
        var board = Board(pwm: 1, dc: 0);
        var fan = Fan(FanHeaderType.FourPinPwm, pack: 3, daisy: true, maxDaisy: 3);

        board.CheckFanHeaderCompatibility(fan).Status.Should().Be(PartsCompatibility.Compatible);
        board.CheckFanHeaderCompatibility([fan, fan]).Reason
            .Should().Be(CompatibilityReason.InsufficientFanHeaders);
    }

    [Fact]
    public void Pwm_fans_cannot_use_dc_headers()
    {
        var board = Board(pwm: 0, dc: 4);
        var fan = Fan(FanHeaderType.FourPinPwm, pack: 1, daisy: false, maxDaisy: null);

        board.CheckFanHeaderCompatibility(fan).Reason
            .Should().Be(CompatibilityReason.InsufficientFanHeaders);
    }

    [Fact]
    public void Dc_fans_can_overflow_onto_unused_pwm_headers()
    {
        var board = Board(pwm: 2, dc: 1);
        var fans = new[]
        {
            Fan(FanHeaderType.ThreePinDc, pack: 1, daisy: false, maxDaisy: null),
            Fan(FanHeaderType.ThreePinDc, pack: 1, daisy: false, maxDaisy: null),
            Fan(FanHeaderType.ThreePinDc, pack: 1, daisy: false, maxDaisy: null),
        };

        board.CheckFanHeaderCompatibility(fans).Status.Should().Be(PartsCompatibility.Compatible);

        var tooMany = fans.Append(
            Fan(FanHeaderType.ThreePinDc, pack: 1, daisy: false, maxDaisy: null)).ToArray();
        board.CheckFanHeaderCompatibility(tooMany).Reason
            .Should().Be(CompatibilityReason.InsufficientFanHeaders);
    }

    [Fact]
    public void HeadersRequiredPerPack_without_daisy_equals_pack_size()
    {
        var fan = Fan(FanHeaderType.FourPinPwm, pack: 3, daisy: false, maxDaisy: null);
        fan.HeadersRequiredPerPack().Should().Be(3);
    }

    private static Motherboard Board(int pwm, int dc) =>
        new(ManufacturerId, "Board", new MotherboardSpecs
        {
            SocketId = Guid.NewGuid(),
            ChipsetId = Guid.NewGuid(),
            RamSlots = 4,
            MaxMemoryGb = 128,
            MaxDimmSizeGb = 32,
            SataPorts = 4,
            PwmFanHeaders = pwm,
            DcFanHeaders = dc,
            EpsConnectors = 1,
            WidthMm = 244,
            HeightMm = 305,
            DdrGeneration = DdrGeneration.Ddr5,
            RamFormFactor = RamFormFactor.UDimm,
            MbFormFactor = MbFormFactor.Atx
        });

    private static ChassisFan Fan(
        FanHeaderType header,
        int pack,
        bool daisy,
        int? maxDaisy) =>
        new(
            "Fan",
            ManufacturerId,
            FanDiameterMm.Mm120,
            pack,
            25m,
            header,
            daisy,
            maxDaisy);
}
