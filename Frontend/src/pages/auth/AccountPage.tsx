import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/use-auth.ts";

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
        <h1>Account</h1>
        <p className="auth-lead">You are signed in.</p>
        <dl className="account-details">
          <div>
            <dt>Name</dt>
            <dd>
              {user.firstName} {user.lastName}
            </dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{user.email}</dd>
          </div>
          <div>
            <dt>Roles</dt>
            <dd>
              {isAdmin ? <span className="role-pill">Admin</span> : null}
              {isMember ? <span className="role-pill">Member</span> : null}
              {user.roles.length === 0 ? "None" : null}
            </dd>
          </div>
        </dl>
        <button
          type="button"
          className="auth-submit"
          onClick={() => void handleLogout()}
        >
          Sign out
        </button>
        {isMember && (
          <button
            type="button"
            className="auth-submit"
            onClick={() => void navigate("/change-password")}
          >
            Change Password
          </button>
        )}
      </div>
    </section>
  );
}
