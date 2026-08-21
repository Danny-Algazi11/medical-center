import { Link } from "react-router-dom";
import { useTranslation } from "../i18n/useTranslation";
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
          © {new Date().getFullYear()} MediCenter. {t("landing.rightsReserved")}
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
