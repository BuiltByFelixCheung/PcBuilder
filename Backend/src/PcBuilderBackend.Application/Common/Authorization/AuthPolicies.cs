namespace PcBuilderBackend.Application.Common.Authorization;

public static class AuthPolicies
{
    public const string MasterDataWrite = "MasterDataWrite";
    public const string CatalogWrite = "CatalogWrite";
    public const string MasterDataImport = "MasterDataImport";
    public const string CatalogImport = "CatalogImport";
    public const string BuildWrite = "BuildWrite";
    public const string ApiKeyManage = "ApiKeyManage";
    public const string Interactive = "Interactive";
}
