import { NavLink } from "react-router-dom";
import { ui } from "@/i18n/translate-enum";

export function Authenticated({
  user,
  isAdmin,
  isMember,
  handleLogout,
}: Readonly<{
  user: { email: string; userName: string } | null;
  isAdmin: boolean;
  isMember: boolean;
  handleLogout: () => Promise<void>;
}>) {
  return (
    <>
      <span className="nav-user">
        {user?.userName}
        {isAdmin ? <span className="role-pill">{ui.label("admin")}</span> : null}
        {isMember ? <span className="role-pill">{ui.label("member")}</span> : null}
      </span>
      <NavLink
        to="/account"
        className={({ isActive }) =>
          isActive ? "nav-link active" : "nav-link"
        }
      >
        {ui.nav("account")}
      </NavLink>
      <button
        type="button"
        className="nav-link nav-button"
        onClick={() => void handleLogout()}
      >
        {ui.action("signOut")}
      </button>
    </>
  );
}
