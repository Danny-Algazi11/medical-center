import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";

import "../components/styles/Admin.css";

import { getDashboardStats, getDoctors, getClinics } from "../api/admin";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
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

function statusLabel(status) {
  const map = {
    pending: "Pending",
    verified: "Verified",
    rejected: "Rejected",
    suspended: "Suspended",
    active: "Active",
  };
  return map[status] || "Unknown";
}

export default function AdminDashboard() {
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
      const [statsData, doctorsRes, clinicsRes] = await Promise.all([
        getDashboardStats(),
        getDoctors(),
        getClinics(),
      ]);

      setStats(statsData);

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
            statusLabel: statusLabel(d.verification_status),
          };
        }),
      );

      setRecentClinics(
        (clinicsRes.data.data || []).slice(0, 5).map((c) => ({
          id: c.id,
          name: c.name,
          status: statusColor(c.status),
          sLabel: statusLabel(c.status),
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
          title="Admin Dashboard"
          searchPlaceholder="Search doctors, clinics..."
        />
        <div className="adm-content">
          {/* Header */}
          <div className="adm-page-header">
            <div className="adm-page-header-left">
              <h1>{getGreeting()}, Admin.</h1>
              <p>System-wide overview — doctors, clinics, and departments.</p>
            </div>
            <div className="adm-header-actions">
              <Link to="/admin/doctors" className="adm-btn adm-btn-dark">
                <i className="ti ti-stethoscope" aria-hidden="true" /> Manage
                doctors
              </Link>
              <Link to="/admin/clinics" className="adm-btn adm-btn-outline">
                <i className="ti ti-building-hospital" aria-hidden="true" />{" "}
                Manage clinics
              </Link>
            </div>
          </div>

          {/* Error display */}
          {error && (
            <div
              style={{
                padding: "12px 16px",
                background: "#fee",
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
              <p>Loading dashboard...</p>
            </div>
          )}

          {!loading && stats && (
            <>
              {/* Stat cards — every number here comes straight from
                  getDashboardStats(), which reads meta.total off each
                  paginated admin list endpoint. */}
              <div
                className="adm-stat-grid"
                style={{ gridTemplateColumns: "repeat(3, 1fr)" }}
              >
                {[
                  {
                    label: "Total doctors",
                    num: stats.totalDoctors,
                    icon: "ti-stethoscope",
                  },
                  {
                    label: "Total clinics",
                    num: stats.totalClinics,
                    icon: "ti-building-hospital",
                  },
                  {
                    label: "Departments",
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
                    <h2 className="adm-card-title">Recent doctors</h2>
                    <Link to="/admin/doctors" className="adm-card-link">
                      View all →
                    </Link>
                  </div>
                  <table className="adm-table">
                    <thead>
                      <tr>
                        <th>Doctor</th>
                        <th>Clinic</th>
                        <th>Status</th>
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
                            No doctors yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="adm-card">
                  <div className="adm-card-header">
                    <h2 className="adm-card-title">Recent clinics</h2>
                    <Link to="/admin/clinics" className="adm-card-link">
                      View all →
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
                      No clinics yet
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
