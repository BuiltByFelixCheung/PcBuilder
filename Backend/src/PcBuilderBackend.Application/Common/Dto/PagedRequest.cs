namespace PcBuilderBackend.Application.Common.Dto;

/// <summary>
/// Shared paging/sorting for list endpoints.
/// <para>
/// Minimal APIs: use with <c>[AsParameters]</c> on GET. Must be a positional record with
/// simple types only — <see cref="List{T}"/> / arrays on properties are inferred as body
/// and break GET (InvalidOperationException: Body was inferred...).
/// </para>
/// <para>
/// Query: <c>?pageIndex=0&amp;pageSize=10&amp;sortBy=name&amp;sortDirection=asc</c>
/// (multiple fields: <c>sortBy=name,price</c>).
/// Body (POST filter endpoints): JSON with the same property names.
/// <see cref="PagedRequest{T}.Filter"/> may be omitted; stores treat null as an empty filter.
/// </para>
/// </summary>
public record PagedRequest(
    int PageIndex = 0,
    int PageSize = 10,
    string SortBy = "name",
    string SortDirection = "asc")
{
    /// <summary>
    /// Parsed sort fields for application use (from comma-separated <see cref="SortBy"/>).
    /// </summary>
    public IReadOnlyList<string> SortFields =>
        string.IsNullOrWhiteSpace(SortBy)
            ? ["name"]
            : SortBy.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
}

/// <summary>
/// Paged request with a filter payload (JSON body on QUERY collection endpoints).
/// </summary>
public record PagedRequest<T>(
    T Filter,
    int PageIndex = 0,
    int PageSize = 10,
    string SortBy = "name",
    string SortDirection = "asc")
    : PagedRequest(PageIndex, PageSize, SortBy, SortDirection);
