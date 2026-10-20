# Database setup and admin user

This guide covers creating a PostgreSQL database for PcBuilder, app login roles, migrations, and adding an **Admin** user.

PcBuilder uses:

- **Catalog** data in the `public` schema (`ConnectionStrings:DefaultConnection`)
- **Identity** data in the `identity` schema (`ConnectionStrings:IdentityConnection`)

Both connection strings may point at the **same** database (recommended) or at separate databases. The SQL below assumes one database with both schemas.

## 1. Create the database

Connect as a PostgreSQL superuser (for example `postgres`) and create the database:

```sql
CREATE DATABASE pcbuilder;
```

Connect to that database:

```sql
\c pcbuilder
```

Create the Identity schema before granting privileges on it:

```sql
CREATE SCHEMA IF NOT EXISTS identity;
```

## 2. Create application roles

Replace `<password>` and `<database>` (for example `pcbuilder`) with your values. Run as a privileged role on that database.

### Catalog role (`public` schema)

```sql
-- pc_builder_app role (public schema)
CREATE ROLE pc_builder_app WITH LOGIN PASSWORD '<password>';
GRANT CONNECT ON DATABASE <database> TO pc_builder_app;
GRANT USAGE, CREATE ON SCHEMA public TO pc_builder_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO pc_builder_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO pc_builder_app;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO pc_builder_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE ON SEQUENCES TO pc_builder_app;
```

### Identity role (`identity` schema)

```sql
-- pc_builder_identity role (identity schema)
CREATE ROLE pc_builder_identity WITH LOGIN PASSWORD '<password>';
GRANT CONNECT ON DATABASE <database> TO pc_builder_identity;
GRANT USAGE, CREATE ON SCHEMA identity TO pc_builder_identity;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA identity TO pc_builder_identity;
ALTER DEFAULT PRIVILEGES IN SCHEMA identity GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO pc_builder_identity;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA identity TO pc_builder_identity;
ALTER DEFAULT PRIVILEGES IN SCHEMA identity GRANT USAGE ON SEQUENCES TO pc_builder_identity;
```

Use these users in your connection strings, for example:

```text
Host=...;Port=5432;Database=pcbuilder;Username=pc_builder_app;Password=...
Host=...;Port=5432;Database=pcbuilder;Username=pc_builder_identity;Password=...
```

As environment variables:

```env
ConnectionStrings__DefaultConnection=Host=...;Port=5432;Database=pcbuilder;Username=pc_builder_app;Password=...
ConnectionStrings__IdentityConnection=Host=...;Port=5432;Database=pcbuilder;Username=pc_builder_identity;Password=...
```

## 3. Apply migrations

### Catalog (`PcBuilderDbContext`)

Catalog migrations are **not** applied automatically at startup. From `Backend/` with the .NET 10 SDK (and `DefaultConnection` pointing at a user that can create objects in `public`, typically `pc_builder_app`):

```bash
dotnet tool restore
dotnet ef database update \
  --project src/PcBuilderBackend.Infrastructure \
  --startup-project src/PcBuilderBackend.Api \
  --context PcBuilderDbContext
```

### Identity (`ApplicationIdentityDbContext`)

Identity migrations run on application startup (`SeedIdentityAsync` → `MigrateAsync`). You can also apply them explicitly:

```bash
dotnet ef database update \
  --project src/PcBuilderBackend.Infrastructure \
  --startup-project src/PcBuilderBackend.Api \
  --context ApplicationIdentityDbContext
```

After tables exist, if you migrated as a different owner than the app roles, re-run the `GRANT … ON ALL TABLES` / `ON ALL SEQUENCES` statements for each schema so `pc_builder_app` and `pc_builder_identity` can use the objects.

## 4. Add an Admin user

On startup, the API:

1. Ensures `Admin` and `Member` roles exist
2. If `Admin:Email` and `Admin:Password` are both set, creates that user (username `admin`) when missing and assigns the **Admin** role

Configure via `appsettings` or environment variables:

```env
Admin__Email=admin@example.com
Admin__Password=your-strong-password
```

Or in JSON:

```json
{
  "Admin": {
    "Email": "admin@example.com",
    "Password": "your-strong-password"
  }
}
```

Then start the API once (Docker or `dotnet run`). Check logs for admin seed success or skip messages.

Notes:

- Password rules follow ASP.NET Identity (minimum length 10 in this project).
- If the email already exists, the seeder only ensures the **Admin** role is assigned.
- If either setting is missing, admin seeding is skipped.
- The seeded admin receives **Admin** only (not **Member**). Builder / My Builds need the Member role; see [USER_MANUAL.md](USER_MANUAL.md).

### Adding another admin later

Options:

1. Temporarily set `Admin__Email` / `Admin__Password` to a new unused email and restart once (creates that user as Admin).
2. Sign in as an existing admin and manage users outside this seeder (there is no in-app “promote to admin” UI today).
3. Insert via Identity APIs / SQL only if you know the Identity schema and password hashing—prefer the seeder.

## 5. Checklist

1. Database created; `identity` schema exists  
2. `pc_builder_app` and `pc_builder_identity` roles granted as above  
3. Connection strings configured  
4. Catalog migrations applied  
5. Identity migrations applied (startup or `dotnet ef`)  
6. `Admin__Email` and `Admin__Password` set for first admin  
7. API started and admin can sign in at `/login`
