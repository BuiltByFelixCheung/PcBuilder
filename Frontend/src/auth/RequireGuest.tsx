import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./use-auth.ts";

// The session starts unknown and only resolves in an effect, which prerender
// never runs. Render the form immediately so the static HTML matches the first
// client paint, and redirect once a session is confirmed.
export function RequireGuest() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/account" replace />;
  }

  return <Outlet />;
}
