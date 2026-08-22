import { Link } from "react-router-dom";
import { useTranslation } from "../i18n/useTranslation";
import logo from "../assets/logo.png";
import "./styles/Auth.css";

export default function DoctorPendingApprovalPage({ role = "doctor" }) {
  const { t } = useTranslation();

  const COPY = {
    doctor: {
      portalName: "doctor portal",
      dashboardName: "doctor dashboard",
      features: [t("pending.doctorFeature1"), t("pending.doctorFeature2"), t("pending.doctorFeature3")],
    },
    reception: {
      portalName: "reception portal",
      dashboardName: "reception dashboard",
      features: [t("pending.doctorFeature1"), t("pending.receptionFeature2"), t("pending.doctorFeature3")],
    },
  };
  const copy = COPY[role] || COPY.doctor;

  return (
    <div className="auth-root">
      <aside className="auth-panel-left" aria-hidden="true">
        <div className="auth-logo">
          <div className="auth-logo-chip">
            <img src={logo} alt="MediZone" className="auth-logo-img" />
          </div>
          <div>
            <div className="auth-logo-sub">{t("auth.healthPortal")}</div>
          </div>
        </div>

        <div className="auth-hero">
          <h2>
            {t("pending.reviewTitle")}
            <br />
            <em>{t("pending.reviewEm")}</em>
          </h2>
          <p>
            {t("pending.reviewingText")} {copy.portalName}.
          </p>
          <div className="auth-features">
            {copy.features.map((f) => (
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

      <main className="auth-panel-right">
        <div
          className="auth-form"
          style={{
            padding: "2rem",
            borderRadius: "18px",
            background: "rgba(15, 118, 110, 0.03)",
            border: "1px solid rgba(15, 118, 110, 0.15)",
          }}
        >
          <div
            style={{
              padding: "1.25rem 1rem",
              borderRadius: "12px",
              background: "rgba(16, 185, 129, 0.08)",
              border: "1px solid rgba(16, 185, 129, 0.25)",
              color: "#14532d",
              fontWeight: 600,
              lineHeight: 1.7,
              marginBottom: "1.5rem",
            }}
          >
            {t("pending.thankYou")}
          </div>

          <p
            style={{
              margin: 0,
              color: "#475569",
              lineHeight: 1.6,
              textAlign: "center",
            }}
          >
            {t("pending.onceApproved")} {copy.dashboardName}.
          </p>

          <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
            <Link
              to="/login"
              className="auth-btn"
              style={{ display: "inline-block" }}
            >
              {t("pending.backToLogin")}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
