# Self-hosting PcBuilder

This guide covers running PcBuilder with Docker using what the repository already provides: a multi-stage [`Dockerfile`](../Dockerfile) that builds the API and the React SPA into one image. There is no in-repo `docker-compose.yml`; you supply PostgreSQL and Redis yourself (or via your platform’s stack).

## 1. Clone the repository

```bash
git clone https://github.com/BuiltByFelixCheung/PcBuilder.git
cd PcBuilder
```

## 2. Install Docker and Docker Compose

Install [Docker Engine](https://docs.docker.com/engine/install/) and the [Docker Compose plugin](https://docs.docker.com/compose/install/). Verify:

```bash
docker --version
docker compose version
```

## 3. Provide PostgreSQL and Redis

The app expects:

- **PostgreSQL** reachable via two connection strings (catalog and Identity). They may point at the same server with different databases or schemas.
- **Redis** for caching (defaults to `localhost:6379` if unset).

The container does not start these services. For creating the database, app roles, migrations, and an admin user, see [DATABASE_SETUP.md](DATABASE_SETUP.md).

## 4. Configure environment variables

ASP.NET Core maps nested settings with `__` (double underscore). Create a `.env` file in the directory where you run Docker (do not commit it).

### Required

| Variable | Purpose |
| --- | --- |
| `ASPNETCORE_ENVIRONMENT` | Must be `Development`, `Staging`, or `Production` |
| `ConnectionStrings__DefaultConnection` | Catalog database |
| `ConnectionStrings__IdentityConnection` | Identity database |
| `Jwt__Issuer` | JWT issuer |
| `Jwt__Audience` | JWT audience |
| `Jwt__Key` | Signing key (at least 32 characters) |
| `Smtp__Host` | SMTP host |
| `Smtp__Port` | SMTP port (for example `587`) |
| `Smtp__From` | From address |
| `AutoMapper__LicenseKey` | AutoMapper license |
| `MediatR__LicenseKey` | MediatR license |

If you set `Smtp__User`, also set `Smtp__Password` (both empty is allowed for open relays).

### Optional

| Variable | Purpose |
| --- | --- |
| `ConnectionStrings__Redis` or `Redis__Configuration` | Redis connection (default `localhost:6379`) |
| `Admin__Email` / `Admin__Password` | When both are set, startup seeds an `Admin` user |
| `S3__BucketName`, `S3__AccessKey`, `S3__SecretKey`, `S3__ServiceUrl` | Object storage for uploads |
| `App__PublicBaseUrl` | Public URL used in links (default `http://localhost:5173`) |

### Infisical (optional)

Infisical is loaded only when all four are set: `Infisical__Url`, `Infisical__ProjectId`, `Infisical__ClientId`, `Infisical__ClientSecret`. Otherwise configuration comes only from environment variables (and any `appsettings` you mount). Environment names map to Infisical slugs `dev`, `staging`, and `prod`.

### Example `.env`

```env
ASPNETCORE_ENVIRONMENT=Production
ConnectionStrings__DefaultConnection=Host=db;Port=5432;Database=pcbuilder;Username=pcbuilder;Password=change-me
ConnectionStrings__IdentityConnection=Host=db;Port=5432;Database=pcbuilder_identity;Username=pcbuilder;Password=change-me
ConnectionStrings__Redis=redis:6379
Jwt__Issuer=PcBuilder
Jwt__Audience=PcBuilder
Jwt__Key=replace-with-a-long-random-secret-at-least-32-chars
Smtp__Host=smtp.example.com
Smtp__Port=587
Smtp__From=noreply@example.com
AutoMapper__LicenseKey=
MediatR__LicenseKey=
App__PublicBaseUrl=https://pcbuilder.example.com
```

## 5. Apply database migrations

The published image does **not** run EF Core migrations. Apply them before the first useful deploy, from a machine with the .NET 10 SDK and network access to your databases (connection strings in `appsettings` or environment variables):

```bash
cd Backend
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

## 6. Build and run with Docker

From the repository root:

```bash
docker build -t pcbuilder .
docker run --env-file .env -p 8080:8080 pcbuilder
```

The image listens on port **8080** (`ASPNETCORE_URLS=http://+:8080`). Open `http://localhost:8080` for the SPA; API routes are under `/api`.

Ensure the container can reach your Postgres and Redis hosts (use hostnames on a shared Docker network, or `host.docker.internal` / the host IP as appropriate).

## 7. Dokploy (Dockerfile application)

If you deploy with [Dokploy](https://dokploy.com/) as a **Dockerfile** application (not Docker Compose):

1. Point the build at the repo [`Dockerfile`](../Dockerfile).
2. Put the settings from section 4 in the Dokploy **Environment** tab (one `KEY=value` per line). Dokploy injects them into the **running** container as process environment variables. ASP.NET Core reads them the same way as `docker run --env-file`.
3. Optionally enable **Create .env file** if you want a `.env` written inside the container as well; it is not required for this app.
4. Redeploy (or restart) after changing environment values so the container picks them up.

Build-time variables / `ARG` are only needed if a value must be available during `docker build`. Connection strings, JWT, SMTP, and similar settings are runtime-only for PcBuilder.
