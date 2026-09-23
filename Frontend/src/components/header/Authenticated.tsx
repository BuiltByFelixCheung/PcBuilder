import { NavLink } from "react-router-dom";

export function Authenticated({
  user,
  isAdmin,
  isMember,
  handleLogout,
}: Readonly<{
  user: { email: string } | null;
  isAdmin: boolean;
  isMember: boolean;
  handleLogout: () => Promise<void>;
}>) {
  return (
    <>
      <span className="nav-user">
        {user?.email}
        {isAdmin ? <span className="role-pill">Admin</span> : null}
        {isMember ? <span className="role-pill">Member</span> : null}
      </span>
      <NavLink
        to="/account"
        className={({ isActive }) =>
          isActive ? "nav-link active" : "nav-link"
        }
      >
        Account
      </NavLink>
      <button
        type="button"
        className="nav-link nav-button"
        onClick={() => void handleLogout()}
      >
        Sign out
      </button>
    </>
  );
}
