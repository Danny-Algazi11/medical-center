import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";
import { useTranslation } from "../i18n/useTranslation";

import "../components/styles/Admin.css";

import { getDoctors, getClinics, getDepartments } from "../api/admin";

function getGreeting(t) {
  const h = new Date().getHours();
  if (h < 12) return t("adminDashboard.goodMorning");
  if (h < 17) return t("adminDashboard.goodAfternoon");
  return t("adminDashboard.goodEvening");
}

function statusColor(status) {
  const map = {
    pending: "amber",
    verified: "green",
    rejected: "red",
    suspended: "red",
    active: "green",
  };
  return map[status] || "gray";
}

function statusLabel(status, t) {
  const map = {
    pending: t("adminCommon.pending"),
    verified: t("adminCommon.verified"),
    rejected: t("adminCommon.rejected"),
    suspended: t("adminCommon.suspended"),
    active: t("adminCommon.active"),
  };
  return map[status] || status;
}

export default function AdminDashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [recentDoctors, setRecentDoctors] = useState([]);
  const [recentClinics, setRecentClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    setError("");
    try {
      const [doctorsRes, clinicsRes, departmentsRes] = await Promise.all([
        getDoctors(),
        getClinics(),
        getDepartments(),
      ]);

      setStats({
        totalDoctors:
          doctorsRes.data.meta?.total ?? doctorsRes.data.data.length,
        totalClinics:
          clinicsRes.data.meta?.total ?? clinicsRes.data.data.length,
        totalDepartments:
          departmentsRes.data.meta?.total ?? departmentsRes.data.data.length,
      });

      setRecentDoctors(
        (doctorsRes.data.data || []).slice(0, 4).map((d) => {
          const acc = d.account || {};
          return {
            id: d.id,
            initials:
              (acc.first_name?.[0] || "D") + (acc.last_name?.[0] || ""),
            name: `Dr. ${acc.first_name || ""} ${acc.last_name || ""}`.trim(),
            spec: d.departments?.[0]?.name || "General",
            clinic: d.clinics?.[0]?.name || "Unassigned",
            status: statusColor(d.verification_status),
            statusLabel: statusLabel(d.verification_status, t),
          };
        }),
      );

      setRecentClinics(
        (clinicsRes.data.data || []).slice(0, 5).map((c) => ({
          id: c.id,
          name: c.name,
          status: statusColor(c.status),
          sLabel: statusLabel(c.status, t),
        })),
      );
    } catch (err) {
      setError(
        err.message || "Failed to load dashboard stats",
      );
      console.error("Error loading dashboard:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="adm-shell">
      <AdminSidebar />
      <div className="adm-main">
        <AdminTopbar
          title={t("admin.dashboard")}
          searchPlaceholder={t("adminCommon.searchDoctors")}
        />
        <div className="adm-content">
          {/* Header */}
          <div className="adm-page-header">
            <div className="adm-page-header-left">
              <h1>{getGreeting(t)}, {t("adminDashboard.admin")}.</h1>
              <p>{t("adminDashboard.overview")}</p>
            </div>
            <div className="adm-header-actions">
              <Link to="/admin/doctors" className="adm-btn adm-btn-dark">
                <i className="ti ti-stethoscope" aria-hidden="true" /> {t("adminDashboard.manageDoctors")}
              </Link>
              <Link to="/admin/clinics" className="adm-btn adm-btn-outline">
                <i className="ti ti-building-hospital" aria-hidden="true" />{" "}
                {t("adminDashboard.manageClinics")}
              </Link>
            </div>
          </div>

          {/* Error display */}
          {error && (
            <div
              style={{
                padding: "12px 16px",
                background: "#fcc",
                border: "1px solid #fcc",
                borderRadius: "8px",
                marginBottom: "16px",
                color: "#c00",
                fontSize: "13px",
              }}
            >
              {error}
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <p>{t("adminDashboard.loadingDashboard")}</p>
            </div>
          )}

          {!loading && stats && (
            <>
              {/* Stat cards — counts read straight off meta.total from the
                  same doctors/clinics/departments calls used for the
                  "recent" tables below, so we don't fetch each list twice. */}
              <div
                className="adm-stat-grid"
                style={{ gridTemplateColumns: "repeat(3, 1fr)" }}
              >
                {[
                  {
                    label: t("adminDashboard.totalDoctors"),
                    num: stats.totalDoctors,
                    icon: "ti-stethoscope",
                  },
                  {
                    label: t("adminDashboard.totalClinics"),
                    num: stats.totalClinics,
                    icon: "ti-building-hospital",
                  },
                  {
                    label: t("adminDashboard.departments"),
                    num: stats.totalDepartments,
                    icon: "ti-category",
                  },
                ].map((s) => (
                  <div className="adm-stat-card" key={s.label}>
                    <div>
                      <div className="adm-stat-label">{s.label}</div>
                      <div className="adm-stat-num">{s.num}</div>
                    </div>
                    <i
                      className={`ti ${s.icon} adm-stat-icon`}
                      aria-hidden="true"
                    />
                  </div>
                ))}
              </div>

              {/* Row 1 — recent doctors + recent clinics */}
              <div className="adm-grid-2 adm-section-gap">
                <div className="adm-card">
                  <div className="adm-card-header">
                    <h2 className="adm-card-title">{t("adminDashboard.recentDoctors")}</h2>
                    <Link to="/admin/doctors" className="adm-card-link">
                      {t("adminCommon.viewAll")}
                    </Link>
                  </div>
                  <table className="adm-table">
                    <thead>
                      <tr>
                        <th>{t("adminDashboard.doctor")}</th>
                        <th>{t("adminDashboard.clinic")}</th>
                        <th>{t("adminDashboard.status")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentDoctors.length > 0 ? (
                        recentDoctors.map((d) => (
                          <tr key={d.id}>
                            <td>
                              <div className="adm-cell">
                                <div className="adm-avatar">
                                  {d.initials}
                                </div>
                                <div>
                                  <div className="adm-cell-name">
                                    {d.name}
                                  </div>
                                  <div className="adm-cell-sub">{d.spec}</div>
                                </div>
                              </div>
                            </td>
                            <td
                              style={{
                                color: "var(--adm-text-secondary)",
                                fontSize: 12,
                              }}
                            >
                              {d.clinic}
                            </td>
                            <td>
                              <span
                                className={`adm-badge adm-badge-${d.status}`}
                              >
                                {d.statusLabel}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="3"
                            style={{ textAlign: "center", padding: 16 }}
                          >
                            {t("adminDashboard.noDoctorsYet")}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="adm-card">
                  <div className="adm-card-header">
                    <h2 className="adm-card-title">{t("adminDashboard.recentClinics")}</h2>
                    <Link to="/admin/clinics" className="adm-card-link">
                      {t("adminCommon.viewAll")}
                    </Link>
                  </div>
                  {recentClinics.length > 0 ? (
                    recentClinics.map((c, i) => (
                      <div
                        key={c.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "12px 18px",
                          borderBottom:
                            i < recentClinics.length - 1
                              ? "1px solid #f5f5f5"
                              : "none",
                        }}
                      >
                        <div style={{ fontSize: 13, fontWeight: 500 }}>
                          {c.name}
                        </div>
                        <span className={`adm-badge adm-badge-${c.status}`}>
                          {c.sLabel}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div
                      style={{
                        padding: 16,
                        textAlign: "center",
                        color: "var(--adm-text-muted)",
                      }}
                    >
                      {t("adminDashboard.noClinicsYet")}
                    </div>
                  )}
                </div>
              </div>

              {/* Note: complaints, ratings, appointments-per-month, and
                  audit-log widgets were removed from this dashboard.
                  None of those have a matching endpoint anywhere in the
                  Postman collection, so they were rendering static mock
                  data. Wire them back in once the backend exposes them. */}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
