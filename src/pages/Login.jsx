import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import GoogleButton from "../components/GoogleButton";
import Modal from "../components/Modal";
import logo from "../assets/bescaled1.png";
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
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  async function handleLogin() {
    if (!agreedToTerms) return;
    await fakeGoogleLogin();
    navigate(logInAsAdmin ? "/admin" : "/dashboard");
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-card__logo-wrap">
          <img src={logo} alt="BeScaled" className="login-card__logo" />
        </div>
        <p className="login-card__subtitle">
          Assess and track your company's innovation maturity.
        </p>

        <label className="terms-checkbox">
          <input
            type="checkbox"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
          />
          <span>
            I agree to the{" "}
            <button
              type="button"
              className="btn-link"
              onClick={(e) => {
                e.preventDefault();
                setIsTermsOpen(true);
              }}
            >
              Terms of Use
            </button>
          </span>
        </label>

        <GoogleButton onClick={handleLogin} loading={isLoggingIn} disabled={!agreedToTerms} />

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

      {isTermsOpen && (
        <Modal title="Terms of Use" onClose={() => setIsTermsOpen(false)}>
          <p>
            By logging in, you consent to BeScaled Hub processing your company's data —
            Innovation Readiness Level scores, AI Maturity Test answers, and related contact
            information — for the purpose of this program.
          </p>
          <p>
            This data is used only to track and support your company's progress during the
            program and to generate reports shared with you and the program administrators. It
            is never sold or shared with third parties outside the program.
          </p>
          <p>
            <strong>All company data is permanently deleted at the end of the program.</strong>{" "}
            Nothing is retained beyond that point.
          </p>
          <p>
            You can withdraw consent and request deletion of your data earlier by contacting the
            program administrators.
          </p>
        </Modal>
      )}
    </div>
  );
}
