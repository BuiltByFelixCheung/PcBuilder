# PcBuilder

Catalog of PC parts, with compatibility checks and saved builds.

The API is ASP.NET Core on .NET 10. The UI is a React 19 app built with Vite. PostgreSQL stores the catalog and ASP.NET Identity in separate databases. Redis caches data. Configuration and secrets are loaded from a local `appsettings.json` and from [Infisical](https://infisical.com/).

Coding agents should follow [AGENTS.md](AGENTS.md).

## Prerequisites

- .NET 10 SDK
- Node.js 22
- PostgreSQL
- Redis on `localhost:6379`, or another address in configuration

## Configuration

`appsettings.json` and `appsettings.*.json` are gitignored. Place `appsettings.json` in `Backend/src/PcBuilderBackend.Api/`. `ASPNETCORE_ENVIRONMENT` must be `Development`, `Staging`, or `Production`.

Infisical is loaded at startup. The local file needs:

- `Infisical:Url`
- `Infisical:ProjectId`
- `Infisical:ClientId`
- `Infisical:ClientSecret`

The process also requires these settings, whether they come from the local file or from Infisical:

- `ConnectionStrings:DefaultConnection` — catalog database
- `ConnectionStrings:IdentityConnection` — Identity database
- `Jwt:Issuer`, `Jwt:Audience`, and `Jwt:Key` (at least 32 characters)
- `Smtp:Host`, `Smtp:Port`, and `Smtp:From`
- `AutoMapper:LicenseKey` and `MediatR:LicenseKey`

Optional:

- `ConnectionStrings:Redis` or `Redis:Configuration` (default `localhost:6379`)
- `Admin:Email` and `Admin:Password` — when both are set, startup seeds an `Admin` user
- `S3:BucketName`, `S3:AccessKey`, `S3:SecretKey`, `S3:ServiceUrl`
- `App:PublicBaseUrl` (default `http://localhost:5173`)

Apply EF Core migrations before the first run. From `Backend/`:

```bash
dotnet tool restore
dotnet ef database update \
  --project src/PcBuilderBackend.Infrastructure \
  --startup-project src/PcBuilderBackend.Api \
  --context PcBuilderDbContext
dotnet ef database update \
  --project src/PcBuilderBackend.Infrastructure \
  --startup-project src/PcBuilderBackend.Api \
  --context ApplicationIdentityDbContext
```

## Run

Install frontend dependencies once:

```bash
npm ci --prefix Frontend
```

Start the API. The `http` profile also starts the Vite dev server.

```bash
dotnet run --project Backend/src/PcBuilderBackend.Api --launch-profile http
```

- App: http://localhost:5173
- API: http://localhost:5155
- OpenAPI and Scalar are available in Development

The Vite server proxies `/api` to the API. To run the UI on its own, use `npm run dev` from `Frontend/`.

## Tests

```bash
dotnet test Backend/PcBuilderBackend.sln
npm test --prefix Frontend
```

CI on `main` builds the solution, runs both suites with coverage, and publishes the results to SonarQube.

## Layout

| Path | Role |
| --- | --- |
| `Backend/src/PcBuilderBackend.Domain` | Entities, enums, and value objects |
| `Backend/src/PcBuilderBackend.Application` | Commands, queries, validation, and DTOs |
| `Backend/src/PcBuilderBackend.Infrastructure` | EF Core, Identity, Redis, S3, email, and Excel import |
| `Backend/src/PcBuilderBackend.Api` | HTTP endpoints |
| `Backend/test` | xUnit tests |
| `Frontend/` | React app |
| `Datasheets/` | Excel import samples |
