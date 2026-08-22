import { Link } from "react-router-dom";
import { useTranslation } from "../i18n/useTranslation";
import logo from "../assets/logo.png";
import "./styles/Landing.css";

export default function LandingPage() {
  const { t } = useTranslation();

  const FEATURES = [
    { icon: "ti-calendar-event", title: t("landing.f1Title"), desc: t("landing.f1Desc") },
    { icon: "ti-file-medical", title: t("landing.f2Title"), desc: t("landing.f2Desc") },
    { icon: "ti-message-circle-heart", title: t("landing.f3Title"), desc: t("landing.f3Desc") },
    { icon: "ti-shield-lock", title: t("landing.f4Title"), desc: t("landing.f4Desc") },
  ];

  const STATS = [
    { num: "98%", label: t("landing.stat1"), fill: 98 },
    { num: "24h", label: t("landing.stat2"), fill: 72 },
    { num: "40+", label: t("landing.stat3"), fill: 60 },
  ];

  return (
    <div className="lp-root">
      {/* ── Nav ── */}
      <nav className="lp-nav">
        <Link to="/" className="lp-logo">
          <div className="lp-logo-chip">
            <img src={logo} alt="MediZone" className="lp-logo-img" />
          </div>
        </Link>

        <div className="lp-nav-links">
          <a href="#features">{t("landing.services")}</a>
          <a href="#features">{t("landing.doctors")}</a>
          <a href="#features">{t("landing.about")}</a>
          <a href="#features">{t("landing.contact")}</a>
        </div>

        <div className="lp-nav-btns">
          <Link to="/login" className="lp-btn-ghost">
            {t("landing.signIn")}
          </Link>
          <Link to="/signup" className="lp-btn-solid">
            {t("landing.getStarted")}
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="lp-hero">
        <div className="lp-hero-left">
          <div className="lp-badge">
            <div className="lp-badge-dot" />
            {t("landing.trustedBy")}
          </div>

          <h1 className="lp-hero-h1">
            {t("landing.heroLine1")}
            <br />
            <em>{t("landing.heroEm")}</em>
          </h1>

          <p className="lp-hero-p">{t("landing.heroP")}</p>

          <div className="lp-hero-btns">
            <Link to="/signup" className="lp-hero-btn-main">
              {t("landing.createFreeAccount")}
            </Link>
            <Link to="/login" className="lp-hero-btn-sec">
              {t("landing.signInArrow")}
            </Link>
          </div>
        </div>

        <div className="lp-hero-right" aria-hidden="true">
          <div className="lp-stats-card">
            <h3>{t("landing.atAGlance")}</h3>
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
          <h2>{t("landing.ctaTitle")}</h2>
          <p>{t("landing.ctaDesc")}</p>
        </div>
        <div className="lp-cta-btns">
          <Link to="/signup" className="lp-cta-btn-w">
            {t("landing.createFreeAccount")}
          </Link>
          <Link to="/login" className="lp-cta-btn-o">
            {t("landing.signInInstead")}
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="lp-footer">
        <span>
          © {new Date().getFullYear()} MediZone. {t("landing.rightsReserved")}
        </span>
        <div className="lp-footer-links">
          <a href="#">{t("landing.privacyPolicy")}</a>
          <a href="#">{t("landing.termsOfService")}</a>
          <a href="#">{t("landing.contact")}</a>
        </div>
      </footer>
    </div>
  );
}
