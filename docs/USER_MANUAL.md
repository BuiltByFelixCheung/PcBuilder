# PcBuilder user manual

PcBuilder is a PC parts catalog with compatibility checks and saved builds. This manual covers **guests** (not signed in), **members** (registered users), and **admins** (catalog and master-data managers).

## Roles at a glance

| Feature | Guest | Member | Admin |
| --- | --- | --- | --- |
| Browse catalog | Yes | Yes | Yes |
| Open builder / check compatibility | Yes | Yes | Builder is hidden in nav; admin accounts without Member cannot use the builder |
| Browse public builds | Yes | Yes | Hidden in nav |
| Save a build you own / set Public | Limited (see [Building a PC](#building-a-pc)) | Yes | No (unless the account also has Member) |
| My Builds / Account | No | Yes | Account yes; My Builds / builder are Member features |
| Create, edit, delete, import catalog parts | No | No | Yes |
| Manage master data | No | No | Yes |

New registrations receive the **Member** role. A seeded admin typically has **Admin** only (not Member), so builder and “My Builds” stay member-facing.

---

## Getting around

- **PC Builder** in the header goes to the home page (`/`).
- **Catalog** — dropdown of part types (Chassis, Motherboards, CPUs, CPU Coolers, RAM, Graphics Cards, PSUs, Storage, Chassis Fans, Wired / Wireless Network Adapters).
- **Builder** and **Browse Builds** — shown for guests and members.
- **Master Data** — shown for admins only.
- Account area: guests see **Sign in** / **Create account**; signed-in users see **Account** / **Sign out** (and role badges). Theme toggle is always available.
- On small screens, open **Menu** for the same links.

---

## Accounts

### Create an account (guest → member)

1. Open **Create account** (`/register`).
2. Submit the form. You become a **Member** and are signed in.
3. Use the account to save builds you own and manage them under **My Builds**.

### Sign in / sign out

- **Sign in** (`/login`) with email and password.
- **Sign out** from the header or Account page.

### Forgot / reset password

1. **Forgot Password** (`/forgot-password`) — request a reset email.
2. Open the link in the email → **Reset Password** (`/reset-password`) and set a new password.

There is no separate email-confirmation step in the app UI.

### Account page

**Account** (`/account`) shows username, email, and roles.

- Members: **Manage My Builds**, **Change Password**.
- **Change Password** (`/change-password`) asks for the current password and a new one.
- Everyone signed in can **Sign out**.

---

## Browsing the catalog

Anyone can browse.

1. Open **Catalog** and pick a part type (for example Motherboards).
2. Use filters, sorting, and paging on the list.
3. Open a row to see the detail page (specs and related data).

### Guests and members on a detail page

- Use **Add to Build** to put the part into the current build (some categories support quantity).
- Continue browsing or open **Builder** to review the full build.

### Admins on catalog pages

- List toolbar: **Edit Selected**, **Delete Selected** (deactivates parts), **New …**, **Import** (Excel).
- Some types open a create/edit dialog; Chassis, Motherboards, CPUs, PSUs, and CPU Coolers also have dedicated **New** pages under `/catalog/.../new`.
- Detail pages show **Edit** (and nested editors where relevant, such as motherboard slots or PSU cables) instead of Add to Build.

Excel templates live under `Datasheets/` in the repository (for operators importing data).

---

## Building a PC

### Open the builder

- **Builder** in the nav, or **Open builder** on the home page → `/builds/current`.
- Or **Add to Build** from a catalog detail page.

Guests and members can use the builder. Signed-in users without the Member role (typical seeded Admin) are redirected away from builder edit routes.

### Assemble and check compatibility

Slots include Chassis, Motherboard, CPU, CPU cooler, Memory, Graphics card, Power supply, plus multi-item slots for Storage, Chassis fans, and network adapters.

- Choose or change parts per slot; adjust quantity where offered.
- The compatibility panel reports problems as you change the build.
- **Clear build** removes the current draft.

### Save

- **Save build** opens a dialog for name and description.
- **Members** can mark the build **Public** so it appears under Browse Builds.
- Save stays disabled while the build is incompatible or a check is still running.
- Guests can create a saved build, but it is not linked to an account (no My Builds / ownership updates). Prefer registering as a Member if you need to edit or manage builds later.

### Edit an existing build

- Owners open **Edit this build** from the build view, or edit from **My Builds** → `/builds/{id}/edit`.

---

## Browse and manage builds

### Browse Builds (public)

- **Browse Builds** (`/builds`) lists public builds. Open one to view it read-only (`/builds/{id}`).

### My Builds (members)

- From Account → **Manage My Builds**, or go to `/builds/me`.
- Edit or delete your builds; use bulk delete when offered.

Private builds are only visible to the owner (and the API returns an error for others).

---

## Admin: catalog management

Admins manage product data under **Catalog**.

Typical workflow:

1. Open a catalog list.
2. **New** — create a part (dialog or full page, depending on type).
3. Select rows → **Edit Selected** for bulk field updates, or **Delete Selected** to deactivate.
4. **Import** — upload an Excel file matching the expected sheet layout for that product type.
5. Open a part → **Edit** for full details and child collections (PCIe/M.2/USB on motherboards, cables on PSUs, drive bays / mounts on chassis, and similar).

Catalog reads (`GET` and `POST …/query`) stay available without admin rights; only writes require Admin.

---

## Admin: master data

**Master Data** holds shared reference data used by catalog parts:

| Section | Route |
| --- | --- |
| Chipsets | `/master-data/chipsets` |
| CPU Series | `/master-data/cpu-series` |
| GPUs | `/master-data/gpus` |
| GPU Series | `/master-data/gpu-series` |
| Manufacturers | `/master-data/manufacturers` |
| Sockets | `/master-data/sockets` |

On each list you can create entries, delete selected, and **Import** from Excel. Most lists also support bulk edit; Chipsets use dialog edit rather than the shared bulk-edit column dialog.

Keep manufacturers, sockets, chipsets, and series accurate before importing large catalog sheets that reference their IDs.

---

## Tips

- Compatibility is evaluated live in the builder; fix reported issues before saving if you want a clean public build.
- Soft-deleted (deactivated) catalog or master-data rows are hidden from normal use but not hard-removed.
- If you need both catalog administration and personal builds, the account must have **Admin** and **Member** roles. Out of the box, the seeded admin is Admin-only.
