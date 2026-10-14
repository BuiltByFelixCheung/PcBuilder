using PcBuilderBackend.Domain.Entities;
using PcBuilderBackend.Domain.Enums;
using PcBuilderBackend.Domain.ValueObjects;

namespace PcBuilderBackend.Domain.Compatibility;

public static class MotherboardFanHeaderCompatibility
{
    /// <summary>
    /// PWM fans require PWM headers. DC fans use DC headers first, then leftover PWM headers.
    /// Each expanded pack entry consumes <see cref="ChassisFan.HeadersRequiredPerPack"/> headers.
    /// </summary>
    public static PartsCompatibilityResult Evaluate(
        int pwmFanHeaders,
        int dcFanHeaders,
        IEnumerable<ChassisFan> fans)
    {
        ArgumentNullException.ThrowIfNull(fans);

        var pwmNeeded = 0;
        var dcNeeded = 0;

        foreach (var fan in fans)
        {
            var headers = fan.HeadersRequiredPerPack();
            switch (fan.HeaderType)
            {
                case FanHeaderType.FourPinPwm:
                    pwmNeeded += headers;
                    break;
                case FanHeaderType.ThreePinDc:
                    dcNeeded += headers;
                    break;
                default:
                    throw new ArgumentOutOfRangeException(
                        nameof(fans),
                        fan.HeaderType,
                        "Fan header type is not recognized.");
            }
        }

        if (pwmNeeded > pwmFanHeaders)
            return PartsCompatibilityResult.Incompatible(CompatibilityReason.InsufficientFanHeaders);

        var remainingPwm = pwmFanHeaders - pwmNeeded;
        if (dcNeeded > dcFanHeaders + remainingPwm)
            return PartsCompatibilityResult.Incompatible(CompatibilityReason.InsufficientFanHeaders);

        return PartsCompatibilityResult.Compatible();
    }
}
