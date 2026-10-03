# AGENTS.md

Guidance for coding agents working in this repository. User instructions in chat override this file.

## Project

PcBuilder is a PC parts catalog and compatibility builder.

- Backend: ASP.NET Core on .NET 10, minimal APIs, MediatR, FluentValidation, AutoMapper, EF Core, PostgreSQL (Npgsql).
- Frontend: React 19, TypeScript, Vite, Tailwind CSS 4, shadcn/ui, TanStack Query, React Router, react-hook-form, Zod, Vitest.
- Secrets and connection strings come from gitignored `appsettings*.json` plus Infisical. Do not commit them.

## Layout

```
Backend/PcBuilderBackend.sln
Backend/src/PcBuilderBackend.Domain          entities, enums, value objects
Backend/src/PcBuilderBackend.Application     commands, queries, validators, DTOs, ports
Backend/src/PcBuilderBackend.Infrastructure  EF Core, Identity, Redis, S3, email, Excel
Backend/src/PcBuilderBackend.Api             minimal API endpoints, auth, filters
Backend/test/                                xUnit projects per layer
Frontend/src                                 app source (`@/` maps to this folder)
Frontend/test                                Vitest tests (not colocated with source)
Datasheets/                                  Excel import samples
```

Application features are folders, not a single services file. Catalog example: `Application/Catalog/Cpus/{Commands,Queries,Dto,Validators}`. Each command or query lives in its own folder with its handler.

## Commands

Backend, from the repo root:

```bash
dotnet build Backend/PcBuilderBackend.sln
dotnet test Backend/PcBuilderBackend.sln
```

Coverage, matching CI:

```bash
dotnet test Backend/PcBuilderBackend.sln \
  --collect:"XPlat Code Coverage" \
  --results-directory coverage/dotnet \
  --settings Backend/coverlet.runsettings
```

Frontend, from `Frontend/`:

```bash
npm ci
npm run dev          # http://localhost:5173, proxies /api to http://localhost:5155
npm test             # vitest run
npm run test:coverage
npm run lint
npm run build        # tsc -b && vite build
```

API, from `Backend/src/PcBuilderBackend.Api`:

```bash
dotnet run --launch-profile http   # http://localhost:5155
```

Development also maps OpenAPI and Scalar. The API hosts the built SPA and falls back to it for non-API routes. Startup requires `ASPNETCORE_ENVIRONMENT` of `Development`, `Staging`, or `Production` (mapped to Infisical slugs `dev`, `staging`, `prod`) and both connection strings: `DefaultConnection` (catalog) and `IdentityConnection` (Identity schema).

EF tools are declared in `Backend/dotnet-tools.json`. Restore them with `dotnet tool restore` from `Backend/`, then:

```bash
dotnet ef migrations add <Name> \
  --project src/PcBuilderBackend.Infrastructure \
  --startup-project src/PcBuilderBackend.Api \
  --context PcBuilderDbContext \
  --output-dir Persistence/Migrations
```

Identity migrations use `ApplicationIdentityDbContext` and `Persistence/Identity/Migrations`. Generate migrations; do not hand-edit `*.Designer.cs` or `*ModelSnapshot.cs`.

## Architecture rules

- Domain entities use private setters and methods (`Rename`, `UpdateManufacturer`, `Activate`, `Deactivate`). Persistence reaches `internal Set*` methods. Do not add public setters to bypass that.
- `Delete*Handler` deactivates (`IsActive = false`). It does not remove the row.
- Commands are records implementing `IRequest<T>` and, when they carry writable fields, the feature's `I*Fields` interface. Validators live beside the feature and include the shared `*FieldsValidator`.
- `ValidationBehavior` runs FluentValidation before handlers. Do not validate only inside the handler.
- Handlers take repositories, `IUnitOfWork`, and `IMapper` via primary constructors, call `SaveChangesAsync`, then map to a DTO.
- Reads go through `I*ReadStore`. Writes go through `I*Repository`. Register both in `Infrastructure/DependencyInjection.cs`.
- Endpoints are static `Map*Endpoints` extensions under `Api/Endpoints`. Catalog is `api/catalog`, master data is `api/master-data`. Complex filters are `POST .../query`, not GET with a large query string.
- `RequireMutationAuthorization` applies `CatalogWrite`, `MasterDataWrite`, or `BuildWrite` to non-GET routes. GET and `POST .../query` stay anonymous. Do not put `[Authorize]` on a query route.
- Roles are `Admin` and `Member` (`AuthRoles`). JSON enums are strings (`JsonStringEnumConverter`).
- Domain enums stored in Postgres must be registered in both `MapDomainEnums` and `ConfigurePostgresEnums` in `NpgsqlEnumConfiguration.cs`.
- EF configurations are `internal sealed` `IEntityTypeConfiguration<T>` classes. Call `ConfigureGuidBaseEntity()`. Dimensions in millimetres are `decimal` with precision `(6, 2)`. Foreign keys to manufacturers and other shared master data use `DeleteBehavior.Restrict`.
- AutoMapper profiles live in `Application/Common/Mappings`. License keys for AutoMapper and MediatR come from configuration.

Copy an existing feature (CPU is the reference) when adding a catalog type: entity, EF configuration, repository, read store, DI registration, commands (create, update, delete, bulk, import), queries, validators, endpoint group, then frontend API module, hook, pages, route, and tests.

## Frontend conventions

- Match existing style: double quotes, semicolons, `@/` imports.
- HTTP calls live in `src/api`. TanStack Query hooks live in `src/hooks` and use the query keys exported next to the API functions.
- List filters are stored in the URL search params (`src/api/catalog/params` and `src/api/paging.ts`).
- Pages go under `src/pages/catalog`, `src/pages/master-data`, `src/pages/auth`, or `src/pages/build`, and are registered in `src/App.tsx`.
- Admin catalog writes use the shared bulk-edit, bulk-delete, and Excel-import components. Do not invent a second table or dialog pattern for a new product.
- UI primitives are the existing shadcn components in `src/components/ui`.

## Testing

- Backend: xUnit, FluentAssertions, NSubstitute. Add tests in the matching `Backend/test/*UnitTests` project.
- Frontend: Vitest and Testing Library. Add tests under `Frontend/test`, mirroring the feature (for example `test/pages/CpuListPage.test.tsx`).
- Run the backend suite, the frontend suite, or both, depending on what changed. Fix failures before finishing. `npm run build` is the typecheck.

## Boundaries

- Do not commit `appsettings.json`, `appsettings.*.json`, `.infisical.json`, or tokens.
- Do not hand-edit EF designer files or model snapshots.
- Do not hard-delete catalog or master-data rows from handlers.
- Do not change compatibility rules in `Application/Build` without tests in `CompatibilityCheckerTests`.
- CI (`.github/workflows/build.yml`) builds the solution, runs both test suites with coverage, and sends results to SonarQube. Migrations, `bin`, `obj`, and `wwwroot` are excluded from analysis. Endpoint projects are excluded from coverage.
