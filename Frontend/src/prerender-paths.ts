// Public URLs rendered to HTML at build time. Detail and account URLs stay on
// the empty SPA shell: publish has no API, and those pages depend on an id or a session.
export const prerenderPaths = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/builds",
  "/catalog/chassis",
  "/catalog/motherboards",
  "/catalog/cpus",
  "/catalog/graphics-cards",
  "/catalog/memories",
  "/catalog/storage",
  "/catalog/psus",
  "/catalog/cpu-coolers",
  "/catalog/chassis-fans",
  "/catalog/wired-network-adapters",
  "/catalog/wireless-network-adapters",
] as const;
