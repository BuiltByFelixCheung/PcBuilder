using PcBuilderBackend.Domain.Enums;

namespace PcBuilderBackend.Domain.Entities;

public class PsuCable : BaseEntity
{
    public Guid PsuId { get; private set; }
    public PsuCableType Type { get; private set; }
    public int CablesCount { get; private set; }
    public int ConnectorsCount { get; private set; }
    
    protected PsuCable() {}

    public PsuCable(Guid psuId, PsuCableType type, int cablesCount, int connectorsCount)
    {
        SetSpecs(psuId, type, cablesCount, connectorsCount);
    }

    public void UpdateSpecs(Guid psuId, PsuCableType type, int cablesCount, int connectorsCount)
    {
        SetSpecs(psuId, type, cablesCount, connectorsCount);
        UpdatedAtUtc = DateTime.UtcNow;
    }

    private void SetSpecs(Guid psuId, PsuCableType type, int cablesCount, int connectorsCount)
    {
        if (psuId == Guid.Empty)
            throw new ArgumentException("PSU ID cannot be empty");
        
        if (!Enum.IsDefined(type) || type == PsuCableType.None)
            throw new ArgumentException("PSU Cable Type is invalid");
        
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(cablesCount);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(connectorsCount);
        
        PsuId = psuId;
        Type = type;
        CablesCount = cablesCount;
        ConnectorsCount = connectorsCount;
    }
}
