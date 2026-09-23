import { Navigate, Outlet } from "react-router-dom";
import { PageStatus } from "../components/PageStatus.tsx";
import { useAuth } from "./useAuth.ts";

export function RequireGuest() {
  const { isReady, isAuthenticated } = useAuth();

  if (!isReady) {
    return <PageStatus>Loading…</PageStatus>;
  }

  if (isAuthenticated) {
    return <Navigate to="/account" replace />;
  }

  return <Outlet />;
}
