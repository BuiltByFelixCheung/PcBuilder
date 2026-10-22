import { PageStatus } from "@/components/PageStatus";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./use-auth";
import { ui } from "@/i18n/translate-enum";

export function RequireAdmin() {
  const { isReady, isAuthenticated, isAdmin } = useAuth();

  if (!isReady) {
    return <PageStatus>{ui.empty("loadingEllipsis")}</PageStatus>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
