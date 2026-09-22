import { useState } from "react";
import { Navigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../context/AuthContext";
import { homePathFor } from "../utils/homePath";
import Modal from "../components/Modal";
import logo from "../assets/bescaled1.png";

export default function Login() {
  const { user, loading, loginWithGoogle } = useAuth();
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Already logged in (e.g. page refresh with a valid session cookie): the role
  // decides which panel to show.
  if (!loading && user) return <Navigate to={homePathFor(user)} replace />;

  // Google gives us an ID token; the backend verifies it and decides the role.
  async function handleGoogleSuccess({ credential }) {
    if (!agreedToTerms) {
      setLoginError("Please agree to the Terms of Use first.");
      return;
    }
    setLoginError("");
    try {
      await loginWithGoogle(credential);
    } catch (err) {
      setLoginError(
        err.status === 403
          ? "This Google account is not authorized to access BeScaled Hub."
          : "Login failed. Please try again.",
      );
    }
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

        <div className={`google-login ${agreedToTerms ? "" : "is-disabled"}`}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() =>
              setLoginError("Google login failed. Please try again.")
            }
            locale={"en"}
          />
        </div>

        {loginError && (
          <p className="login-error" role="alert">
            {loginError}
          </p>
        )}
      </div>

      {isTermsOpen && (
        <Modal title="Terms of Use" onClose={() => setIsTermsOpen(false)}>
          <p>
            By logging in, you consent to BeScaled Hub processing your company's
            data — Innovation Readiness Level scores, AI Maturity Test answers,
            and related contact information — for the purpose of this program.
          </p>
          <p>
            This data is used only to track and support your company's progress
            during the program and to generate reports shared with you and the
            program administrators. It is never sold or shared with third
            parties outside the program.
          </p>
          <p>
            <strong>
              All company data is permanently deleted at the end of the program.
            </strong>{" "}
            Nothing is retained beyond that point.
          </p>
          <p>
            You can withdraw consent and request deletion of your data earlier
            by contacting the program administrators.
          </p>
        </Modal>
      )}
    </div>
  );
}
