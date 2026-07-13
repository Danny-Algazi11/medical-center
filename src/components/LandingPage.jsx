import { Link } from "react-router-dom";
import "./styles/Landing.css";

const FEATURES = [
  {
    icon: "ti-calendar-event",
    title: "Easy Appointments",
    desc: "Book, reschedule or cancel visits in seconds, any time of day.",
  },
  {
    icon: "ti-file-medical",
    title: "Your Records",
    desc: "Instant access to lab results, prescriptions, and visit history.",
  },
  {
    icon: "ti-message-circle-heart",
    title: "Message Your Doctor",
    desc: "Secure direct messaging with your care team — no phone tag needed.",
  },
  {
    icon: "ti-shield-lock",
    title: "HIPAA Compliant",
    desc: "Your data is encrypted and protected by industry-leading security.",
  },
];

const STATS = [
  { num: "98%", label: "Patient satisfaction score", fill: 98 },
  { num: "24h", label: "Average response time", fill: 72 },
  { num: "40+", label: "Specialist doctors on staff", fill: 60 },
];

export default function LandingPage() {
  return (
    <div className="lp-root">
      {/* ── Nav ── */}
      <nav className="lp-nav">
        <Link to="/" className="lp-logo">
          <div className="lp-logo-icon">
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              <path d="M12 5 9.04 7.96a2.17 2.17 0 0 0 0 3.08v0c.82.82 2.13.85 3 .07l2.07-1.9a2.82 2.82 0 0 1 3.79 0l2.96 2.66" />
              <path d="m18 15-2-2" />
              <path d="m15 18-2-2" />
            </svg>
          </div>
          <span className="lp-logo-name">MediCenter</span>
        </Link>

        <div className="lp-nav-links">
          <a href="#features">Services</a>
          <a href="#features">Doctors</a>
          <a href="#features">About</a>
          <a href="#features">Contact</a>
        </div>

        <div className="lp-nav-btns">
          <Link to="/login" className="lp-btn-ghost">
            Sign in
          </Link>
          <Link to="/signup" className="lp-btn-solid">
            Get started
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="lp-hero">
        <div className="lp-hero-left">
          <div className="lp-badge">
            <div className="lp-badge-dot" />
            Trusted by 12,000+ patients
          </div>

          <h1 className="lp-hero-h1">
            Healthcare that
            <br />
            puts <em>you first.</em>
          </h1>

          <p className="lp-hero-p">
            Book appointments, access your records, and stay connected with your
            care team — all from one secure, easy-to-use portal.
          </p>

          <div className="lp-hero-btns">
            <Link to="/signup" className="lp-hero-btn-main">
              Create free account
            </Link>
            <Link to="/login" className="lp-hero-btn-sec">
              Sign in →
            </Link>
          </div>
        </div>

        <div className="lp-hero-right" aria-hidden="true">
          <div className="lp-stats-card">
            <h3>At a glance</h3>
            {STATS.map(({ num, label, fill }) => (
              <div className="lp-stat" key={label}>
                <div className="lp-stat-num">{num}</div>
                <div className="lp-stat-label">{label}</div>
                <div className="lp-stat-bar">
                  <div className="lp-stat-fill" style={{ width: `${fill}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="lp-features" id="features">
        {FEATURES.map(({ icon, title, desc }) => (
          <div className="lp-feature" key={title}>
            <div className="lp-feature-icon">
              <i className={`ti ${icon}`} aria-hidden="true" />
            </div>
            <h4>{title}</h4>
            <p>{desc}</p>
          </div>
        ))}
      </section>

      {/* ── CTA ── */}
      <section className="lp-cta">
        <div className="lp-cta-text">
          <h2>Ready to take control of your health?</h2>
          <p>Join thousands of patients already using MediCenter.</p>
        </div>
        <div className="lp-cta-btns">
          <Link to="/signup" className="lp-cta-btn-w">
            Create free account
          </Link>
          <Link to="/login" className="lp-cta-btn-o">
            Sign in instead
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="lp-footer">
        <span>
          © {new Date().getFullYear()} MediCenter. All rights reserved.
        </span>
        <div className="lp-footer-links">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Contact</a>
        </div>
      </footer>
    </div>
  );
}
