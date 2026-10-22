import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/use-auth.ts";
import { ui } from "@/i18n/translate-enum";

export function AccountPage() {
  const { user, isAdmin, isMember, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    void navigate("/");
  }

  if (!user) return null;

  return (
    <section className="account-page">
      <div className="account-card">
        <h1>{ui.page("account")}</h1>
        <p className="auth-lead">{ui.message("youAreSignedIn")}</p>
        <dl className="account-details">
          <div>
            <dt>{ui.label("username")}</dt>
            <dd>{user.userName}</dd>
          </div>
          <div>
            <dt>{ui.label("email")}</dt>
            <dd>{user.email}</dd>
          </div>
          <div>
            <dt>{ui.label("roles")}</dt>
            <dd>
              {isAdmin ? <span className="role-pill">{ui.label("admin")}</span> : null}
              {isMember ? <span className="role-pill">{ui.label("member")}</span> : null}
              {user.roles.length === 0 ? ui.label("none") : null}
            </dd>
          </div>
        </dl>
        {isMember && (
          <button
            type="button"
            className="auth-submit"
            onClick={() => void navigate("/builds/me")}
          >
            {ui.action("manageMyBuilds")}
          </button>
        )}
        <button
          type="button"
          className="auth-submit"
          onClick={() => void handleLogout()}
        >
          {ui.action("signOut")}
        </button>
        {isMember && (
          <button
            type="button"
            className="auth-submit"
            onClick={() => void navigate("/change-password")}
          >
            {ui.action("changePassword")}
          </button>
        )}
      </div>
    </section>
  );
}
