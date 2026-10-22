import { Navigate, Outlet } from "react-router-dom";
import { PageStatus } from "../components/PageStatus.tsx";
import { useAuth } from "./use-auth.ts";
import { ui } from "@/i18n/translate-enum";

export function RequireGuest() {
  const { isReady, isAuthenticated } = useAuth();

  if (!isReady) {
    return <PageStatus>{ui.empty("loadingEllipsis")}</PageStatus>;
  }

  if (isAuthenticated) {
    return <Navigate to="/account" replace />;
  }

  return <Outlet />;
}
