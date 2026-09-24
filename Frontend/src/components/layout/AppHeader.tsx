import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/use-auth";
import { Header } from "@/components/layout/header";

export function AppHeader() {
  const { isReady, isAuthenticated, user, isAdmin, isMember, logout } =
    useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    void navigate("/");
  }

  return (
    <header className="app-header">
      <Link to="/" className="brand">
        PC Builder
      </Link>
      <nav className="app-nav" aria-label="Account">
        {!isReady ? null : (
          <Header
            isAuthenticated={isAuthenticated}
            user={user}
            isAdmin={isAdmin}
            isMember={isMember}
            handleLogout={handleLogout}
          />
        )}
      </nav>
    </header>
  );
}
