import { Navigate, Outlet, useLocation } from "react-router-dom";
import { PageStatus } from "../components/PageStatus.tsx";
import { useAuth } from "./use-auth.ts";
import type { AuthRole } from "./types.ts";
import { ui } from "@/i18n/translate-enum";

export function RequireAuth({ role }: Readonly<{ role?: AuthRole }>) {
  const { isReady, isAuthenticated, hasRole } = useAuth();
  const location = useLocation();

  if (!isReady) {
    return <PageStatus>{ui.empty("loadingEllipsis")}</PageStatus>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (role && !hasRole(role)) {
    return (
      <section className="account-page">
        <div className="account-card">
          <h1>{ui.page("notAllowed")}</h1>
          <p>{ui.message("roleRequired", { role: role === "Admin" ? ui.label("admin") : ui.label("member") })}</p>
        </div>
      </section>
    );
  }

  return <Outlet />;
}
