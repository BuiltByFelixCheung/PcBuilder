import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/use-auth";
import { Header } from "@/components/layout/header";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { ui } from "@/i18n/translate-enum";

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
      <Link to="/" className="brand" aria-label="Logo">
        <span className="logo" />
      </Link>
      <nav className="app-nav" aria-label={ui.nav("account")}>
        <LanguageToggle />
        <ThemeToggle />
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
