import { NavLink } from "react-router-dom";

export function Anonymous() {
  return (
    <>
      <NavLink
        to="/login"
        className={({ isActive }) =>
          isActive ? "nav-link active" : "nav-link"
        }
      >
        Sign in
      </NavLink>
      <NavLink
        to="/register"
        className={({ isActive }) =>
          isActive ? "nav-link active" : "nav-link"
        }
      >
        Create account
      </NavLink>
    </>
  );
}
