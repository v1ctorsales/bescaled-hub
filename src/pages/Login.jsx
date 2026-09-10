import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import GoogleButton from "../components/GoogleButton";
import ThemeToggle from "../components/ThemeToggle";
import { IS_ADMIN_VIEW } from "../config";

export default function Login() {
  const { fakeGoogleLogin, isLoggingIn } = useAuth();
  const navigate = useNavigate();
  // Prototype-only toggle: lets us preview either panel without editing
  // code. Defaults to the IS_ADMIN_VIEW flag in src/config.js.
  // TODO(backend): remove this toggle once real roles/permissions exist —
  // the destination panel should be decided by the authenticated user's
  // role, not a checkbox on the login screen.
  const [logInAsAdmin, setLogInAsAdmin] = useState(IS_ADMIN_VIEW);

  async function handleLogin() {
    await fakeGoogleLogin();
    navigate(logInAsAdmin ? "/admin" : "/dashboard");
  }

  return (
    <div className="login-page">
      <div className="login-page__theme-toggle">
        <ThemeToggle />
      </div>
      <div className="login-card">
        <h1 className="login-card__logo">BeScaled Hub </h1>
        <p className="login-card__subtitle">
          Assess and track your company's innovation maturity.
        </p>
        <GoogleButton onClick={handleLogin} loading={isLoggingIn} />

        <label className="admin-toggle">
          <input
            type="checkbox"
            checked={logInAsAdmin}
            onChange={(e) => setLogInAsAdmin(e.target.checked)}
          />
          <span>Log in as admin</span>
          <span className="admin-toggle__hint">(prototype only)</span>
        </label>
      </div>
    </div>
  );
}
