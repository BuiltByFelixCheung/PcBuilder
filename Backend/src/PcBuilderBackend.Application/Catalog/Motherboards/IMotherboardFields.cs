using PcBuilderBackend.Domain.Enums;

namespace PcBuilderBackend.Application.Catalog.Motherboards;

public interface IMotherboardFields
{
    string Name { get; }
    Guid ManufacturerId { get; }
    Guid SocketId { get; }
    Guid ChipsetId { get; }
    int RamSlots { get; }
    int MaxMemoryGb { get; }
    int MaxDimmSizeGb { get; }
    int SataPorts { get; }
    int PwmFanHeaders { get; }
    int DcFanHeaders { get; }
    int EpsConnectors { get; }
    decimal WidthMm { get; }
    decimal HeightMm { get; }
    DdrGeneration DdrGeneration { get; }
    RamFormFactor RamFormFactor { get; }
    MbFormFactor FormFactor { get; }
}
