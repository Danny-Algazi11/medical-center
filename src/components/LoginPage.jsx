import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "../i18n/useTranslation";
import "./styles/Auth.css";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { t } = useTranslation();

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const from = location.state?.from;

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError(t("auth.fillAllFields"));
      return;
    }
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      let dest = from;

      if (!dest) {
        if (user.role === "admin") {
          dest = "/admin";
        } else if (user.role === "receptionist") {
          dest = "/reception";
        } else if (user.role === "doctor") {
          dest = "/dashboard";
        } else {
          dest = "/dashboard"; // fallback
        }
      }

      navigate(dest, { replace: true });
    } catch (err) {
      const message = err.message || "";

      // Backend rejects login for unapproved accounts with a message like
      // "Your doctor account is pending administrator verification." —
      // catch that specific case and send them to the pending-approval
      // page instead of just showing a red error banner. We don't get a
      // role back on a failed login, so we read it out of the message
      // itself (the backend includes "doctor"/"receptionist" in the text).
      if (/pending/i.test(message)) {
        if (/receptionist/i.test(message)) {
          navigate("/reception-pending", { replace: true });
        } else {
          navigate("/doctor-pending", { replace: true });
        }
        return;
      }

      setError(message || t("auth.loginFailed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-root">
      {/* ── Left panel ── */}
      <aside className="auth-panel-left" aria-hidden="true">
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              <path d="M12 5 9.04 7.96a2.17 2.17 0 0 0 0 3.08v0c.82.82 2.13.85 3 .07l2.07-1.9a2.82 2.82 0 0 1 3.79 0l2.96 2.66" />
              <path d="m18 15-2-2" />
              <path d="m15 18-2-2" />
            </svg>
          </div>
          <div>
            <div className="auth-logo-name">MediZone</div>
            <div className="auth-logo-sub">{t("auth.healthPortal")}</div>
          </div>
        </div>

        <div className="auth-hero">
          <h2>
            {t("auth.heroTitleLine1")}
            <br />
            <em>{t("auth.heroTitleEm")}</em>
          </h2>
          <p>{t("auth.heroP")}</p>
          <div className="auth-features">
            {[t("auth.f1"), t("auth.f2"), t("auth.f3"), t("auth.f4")].map((f) => (
              <div className="auth-feature" key={f}>
                <div className="auth-feature-dot" />
                {f}
              </div>
            ))}
          </div>
        </div>

        <p className="auth-tagline">
          © {new Date().getFullYear()} MediZone. {t("landing.rightsReserved")}
        </p>
      </aside>

      {/* ── Right panel ── */}
      <main className="auth-panel-right">
        <nav className="auth-tabs" aria-label="Auth navigation">
          <Link to="/login" className="auth-tab active">
            {t("auth.login")}
          </Link>
          <Link to="/signup" className="auth-tab">
            {t("auth.createAccount")}
          </Link>
        </nav>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {error && (
            <div className="auth-error" role="alert">
              {error}
            </div>
          )}

          <div className="auth-field">
            <label className="auth-label" htmlFor="email">
              {t("auth.emailAddress")}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              className="auth-input"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
              required
            />
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="password">
              {t("auth.password")}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              className="auth-input"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
              required
            />
          </div>

          <div className="auth-forgot">
            <Link to="/forgot-password">{t("auth.forgotPassword")}</Link>
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? t("auth.signingIn") : t("auth.loginButton")}
          </button>

          <div className="auth-divider">
            <div className="auth-divider-line" />
            <span>{t("auth.orContinueWith")}</span>
            <div className="auth-divider-line" />
          </div>

          <div className="auth-oauth">
            <button type="button" className="auth-oauth-btn">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {t("auth.google")}
            </button>
            <button type="button" className="auth-oauth-btn">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              {t("auth.hospitalSSO")}
            </button>
          </div>

          <p className="auth-switch">
            {t("auth.noAccount")} <Link to="/signup">{t("auth.createOne")}</Link>
          </p>
        </form>
      </main>
    </div>
  );
}
