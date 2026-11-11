namespace PcBuilderBackend.Application.Common.Authorization;

public static class AuthPolicyRules
{
    public static string[] RolesFor(string policy) => policy switch
    {
        AuthPolicies.CatalogWrite
            or AuthPolicies.MasterDataWrite
            or AuthPolicies.ApiKeyManage => [AuthRoles.Admin],
        AuthPolicies.CatalogImport or AuthPolicies.MasterDataImport => [AuthRoles.Admin, AuthRoles.Importer],
        AuthPolicies.BuildWrite => [AuthRoles.Member],
        _ => []
    };

    public static bool Allows(string policy, params string[] roles) =>
        RolesFor(policy).Any(required => roles.Contains(required, StringComparer.Ordinal));
}
