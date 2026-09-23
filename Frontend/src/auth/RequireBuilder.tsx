import { PageStatus } from "@/components/PageStatus";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./useAuth";

export function RequireBuilder() {
  const { isReady, isAuthenticated, isMember } = useAuth();

  if (!isReady) {
    return <PageStatus>Loading…</PageStatus>;
  }

  if (isAuthenticated && !isMember) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
