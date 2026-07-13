import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./styles/Auth.css";

const ROLES = ["Patient", "Doctor / Staff"];

export default function SignupPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "Patient",
    agreed: false,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setError("");
  }

  function selectRole(role) {
    setForm((prev) => ({ ...prev, role }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.firstName || !form.lastName || !form.email || !form.password) {
      setError("Please fill in all fields.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (!form.agreed) {
      setError("You must agree to the Terms of Service.");
      return;
    }

    setLoading(true);
    try {
      // TODO: replace with your real auth call
      // await authService.register(form);
      navigate("/login");
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
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
            <div className="auth-logo-name">MediCenter</div>
            <div className="auth-logo-sub">Health Portal</div>
          </div>
        </div>

        <div className="auth-hero">
          <h2>
            Join us
            <br />
            <em>in better care.</em>
          </h2>
          <p>
            Create your free account and get instant access to your personal
            health portal in minutes.
          </p>
          <div className="auth-features">
            {[
              "Free to create an account",
              "Instant access to your records",
              "Direct messaging with your doctor",
              "Secure & HIPAA compliant",
            ].map((f) => (
              <div className="auth-feature" key={f}>
                <div className="auth-feature-dot" />
                {f}
              </div>
            ))}
          </div>
        </div>

        <p className="auth-tagline">
          © {new Date().getFullYear()} MediCenter. All rights reserved.
        </p>
      </aside>

      {/* ── Right panel ── */}
      <main className="auth-panel-right">
        <nav className="auth-tabs" aria-label="Auth navigation">
          <Link to="/login" className="auth-tab">
            Log in
          </Link>
          <Link to="/signup" className="auth-tab active">
            Create account
          </Link>
        </nav>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {error && (
            <div className="auth-error" role="alert">
              {error}
            </div>
          )}

          <div className="auth-form-row">
            <div className="auth-field">
              <label className="auth-label" htmlFor="firstName">
                First name
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                className="auth-input"
                placeholder="Ana"
                value={form.firstName}
                onChange={handleChange}
                autoComplete="given-name"
                required
              />
            </div>
            <div className="auth-field">
              <label className="auth-label" htmlFor="lastName">
                Last name
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                className="auth-input"
                placeholder="Ionescu"
                value={form.lastName}
                onChange={handleChange}
                autoComplete="family-name"
                required
              />
            </div>
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="email">
              Email address
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
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              className="auth-input"
              placeholder="Min. 8 characters"
              value={form.password}
              onChange={handleChange}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>

          <div className="auth-field">
            <label className="auth-label">I am a</label>
            <div
              className="auth-role-grid"
              role="group"
              aria-label="Select your role"
            >
              {ROLES.map((role) => (
                <button
                  key={role}
                  type="button"
                  className={`auth-role-btn${form.role === role ? " selected" : ""}`}
                  onClick={() => selectRole(role)}
                  aria-pressed={form.role === role}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          <div className="auth-terms">
            <input
              type="checkbox"
              id="agreed"
              name="agreed"
              checked={form.agreed}
              onChange={handleChange}
            />
            <label htmlFor="agreed">
              I agree to the <Link to="/terms">Terms of Service</Link> and{" "}
              <Link to="/privacy">Privacy Policy</Link>
            </label>
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? "Creating account…" : "Create account"}
          </button>

          <p className="auth-switch">
            Already have an account? <Link to="/login">Sign in →</Link>
          </p>
        </form>
      </main>
    </div>
  );
}
