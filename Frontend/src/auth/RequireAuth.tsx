import { Navigate, Outlet, useLocation } from "react-router-dom";
import { PageStatus } from "../components/PageStatus.tsx";
import { useAuth } from "./useAuth.ts";
import type { AuthRole } from "./types.ts";

export function RequireAuth({ role }: Readonly<{ role?: AuthRole }>) {
  const { isReady, isAuthenticated, hasRole } = useAuth();
  const location = useLocation();

  if (!isReady) {
    return <PageStatus>Loading…</PageStatus>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (role && !hasRole(role)) {
    return (
      <section className="account-page">
        <div className="account-card">
          <h1>Not allowed</h1>
          <p>This page needs the {role} role.</p>
        </div>
      </section>
    );
  }

  return <Outlet />;
}
