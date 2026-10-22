import { NavLink } from "react-router-dom";
import { ui } from "@/i18n/translate-enum";

export function Anonymous() {
  return (
    <>
      <NavLink
        to="/login"
        className={({ isActive }) =>
          isActive ? "nav-link active" : "nav-link"
        }
      >
        {ui.action("signIn")}
      </NavLink>
      <NavLink
        to="/register"
        className={({ isActive }) =>
          isActive ? "nav-link active" : "nav-link"
        }
      >
        {ui.page("createAccount")}
      </NavLink>
    </>
  );
}
