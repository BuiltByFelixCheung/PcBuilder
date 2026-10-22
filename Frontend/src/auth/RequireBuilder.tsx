import { PageStatus } from "@/components/PageStatus";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./use-auth";
import { ui } from "@/i18n/translate-enum";

export function RequireBuilder() {
  const { isReady, isAuthenticated, isMember } = useAuth();

  if (!isReady) {
    return <PageStatus>{ui.empty("loadingEllipsis")}</PageStatus>;
  }

  if (isAuthenticated && !isMember) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
