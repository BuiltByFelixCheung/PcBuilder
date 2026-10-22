import { useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/auth/use-auth";
import { Header } from "@/components/layout/header";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import {
  getCatalogLinks,
  getMasterDataLinks,
} from "@/components/layout/nav-links";
import { ui } from "@/i18n/translate-enum";

function navClassName({ isActive }: { isActive: boolean }) {
  return isActive ? "nav-link active" : "nav-link";
}

export function MobileHeader() {
  const [open, setOpen] = useState(false);
  const { isReady, isAuthenticated, user, isAdmin, isMember, logout } =
    useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [openPath, setOpenPath] = useState(location.pathname);
  const catalogLinks = getCatalogLinks();
  const masterDataLinks = getMasterDataLinks();
  if (openPath !== location.pathname) {
    setOpenPath(location.pathname);
    setOpen(false);
  }

  async function handleLogout() {
    await logout();
    void navigate("/");
  }

  return (
    <header className="app-header mobile-header">
      <Link to="/" className="brand">
        <span className="logo" role="img" aria-label="Logo" />
      </Link>
      <div className="app-nav">
        <LanguageToggle />
        <ThemeToggle />
        <button
          type="button"
          className="nav-link nav-button nav-menu-button"
          aria-expanded={open}
          aria-controls="mobile-app-nav"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X aria-hidden /> : <Menu aria-hidden />}
          {ui.nav("menu")}
        </button>
      </div>
      {open ? (
        <nav
          id="mobile-app-nav"
          className="mobile-app-nav"
          aria-label={ui.nav("menu")}
        >
          <div className="mobile-nav-section">
            <p className="mobile-nav-label">{ui.nav("catalog")}</p>
            {catalogLinks.map((link) => (
              <NavLink key={link.href} to={link.href} className={navClassName}>
                {link.name}
              </NavLink>
            ))}
          </div>
          {!isAdmin ? (
            <div className="mobile-nav-section">
              <NavLink to="/builds/current" className={navClassName}>
                {ui.nav("builder")}
              </NavLink>
              <NavLink to="/builds" className={navClassName}>
                {ui.nav("browseBuilds")}
              </NavLink>
            </div>
          ) : (
            <div className="mobile-nav-section">
              <p className="mobile-nav-label">{ui.nav("masterData")}</p>
              {masterDataLinks.map((link) => (
                <NavLink key={link.href} to={link.href} className={navClassName}>
                  {link.name}
                </NavLink>
              ))}
            </div>
          )}
          {!isReady ? null : (
            <div className="mobile-nav-section">
              <Header
                isAuthenticated={isAuthenticated}
                user={user}
                isAdmin={isAdmin}
                isMember={isMember}
                handleLogout={handleLogout}
              />
            </div>
          )}
        </nav>
      ) : null}
    </header>
  );
}
