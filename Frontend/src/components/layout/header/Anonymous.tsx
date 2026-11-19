import { NavLink, useLocation } from "react-router-dom";
import { buildViewReturnState } from "@/auth/redirect.ts";
import { ui } from "@/i18n/translate-enum";

export function Anonymous() {
  const location = useLocation();
  const returnState = buildViewReturnState(location.pathname);

  return (
    <>
      <NavLink
        to="/login"
        state={returnState}
        className={({ isActive }) =>
          isActive ? "nav-link active" : "nav-link"
        }
      >
        {ui.action("signIn")}
      </NavLink>
      <NavLink
        to="/register"
        state={returnState}
        className={({ isActive }) =>
          isActive ? "nav-link active" : "nav-link"
        }
      >
        {ui.page("createAccount")}
      </NavLink>
    </>
  );
}
