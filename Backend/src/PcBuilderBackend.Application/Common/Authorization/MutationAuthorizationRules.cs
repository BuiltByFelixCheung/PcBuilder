namespace PcBuilderBackend.Application.Common.Authorization;

public static class MutationAuthorizationRules
{
    public static string? PolicyFor(
        IEnumerable<string> httpMethods,
        string? route,
        string writePolicy,
        string importPolicy)
    {
        var methods = httpMethods as IReadOnlyCollection<string> ?? httpMethods.ToArray();
        if (methods.Count == 0)
            return null;

        if (methods.Any(method => method.Equals("GET", StringComparison.OrdinalIgnoreCase)))
            return null;

        if (IsQueryRoute(route))
            return null;

        if (methods.Any(method => method.Equals("POST", StringComparison.OrdinalIgnoreCase)))
            return importPolicy;

        return writePolicy;
    }

    public static bool IsQueryRoute(string? route)
    {
        if (string.IsNullOrEmpty(route))
            return false;

        return route.Equals("query", StringComparison.OrdinalIgnoreCase)
            || route.EndsWith("/query", StringComparison.OrdinalIgnoreCase)
            || route.EndsWith("/query/", StringComparison.OrdinalIgnoreCase);
    }
}
