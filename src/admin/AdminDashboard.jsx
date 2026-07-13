import { Link } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";
import "../components/styles/Admin.css";

const STATS = [
  {
    label: "Total doctors",
    num: 148,
    sub: "12 pending verification",
    icon: "ti-stethoscope",
  },
  {
    label: "Active clinics",
    num: 24,
    sub: "3 branches inactive",
    icon: "ti-building-hospital",
  },
  {
    label: "Open complaints",
    num: 7,
    sub: "2 marked high priority",
    icon: "ti-alert-circle",
    red: true,
  },
  {
    label: "Avg doctor rating",
    num: "4.6",
    sub: "↑ 0.2 from last month",
    icon: "ti-star",
  },
];

const RECENT_DOCTORS = [
  {
    initials: "DA",
    name: "Dr. Ahmad",
    spec: "Cardiology",
    clinic: "City Central",
    status: "active",
    statusLabel: "Active",
  },
  {
    initials: "JL",
    name: "Dr. Julia Lee",
    spec: "Pediatrics",
    clinic: "North Branch",
    status: "amber",
    statusLabel: "Pending",
  },
  {
    initials: "MK",
    name: "Dr. Marcus Kim",
    spec: "General",
    clinic: "East Branch",
    status: "red",
    statusLabel: "Suspended",
  },
  {
    initials: "TC",
    name: "Dr. Tahani Chen",
    spec: "Dermatology",
    clinic: "City Central",
    status: "teal",
    statusLabel: "Verified",
  },
];

const COMPLAINTS = [
  {
    title: "Missed diagnosis — Dr. Kim",
    patient: "P-4421",
    ago: "2 days ago",
    priority: "red",
    pLabel: "High",
  },
  {
    title: "Rude behaviour — Dr. Chen",
    patient: "P-8832",
    ago: "4 days ago",
    priority: "amber",
    pLabel: "Medium",
  },
  {
    title: "Late appointment — Dr. Ahmad",
    patient: "P-9102",
    ago: "1 week ago",
    priority: "teal",
    pLabel: "Low",
  },
];

const TOP_RATINGS = [
  { name: "Dr. Ahmad", stars: "★★★★★", score: 4.9, pct: 98 },
  { name: "Dr. Chen", stars: "★★★★★", score: 4.6, pct: 92 },
  { name: "Dr. Tahani", stars: "★★★★☆", score: 4.2, pct: 84 },
  { name: "Dr. Julia Lee", stars: "★★★★☆", score: 4.0, pct: 80 },
];

const CLINICS = [
  { name: "City Central", appts: 42, status: "active", sLabel: "Active" },
  { name: "North Branch", appts: 28, status: "active", sLabel: "Active" },
  { name: "East Branch", appts: 0, status: "red", sLabel: "Inactive" },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function AdminDashboard() {
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
              <p>
                System-wide overview — doctors, clinics, complaints, and
                performance.
              </p>
            </div>
            <div className="adm-header-actions">
              <button className="adm-btn adm-btn-outline">
                <i className="ti ti-download" aria-hidden="true" /> Export
                report
              </button>
              <Link to="/admin/doctors" className="adm-btn adm-btn-dark">
                <i className="ti ti-plus" aria-hidden="true" /> Add doctor
              </Link>
            </div>
          </div>

          {/* Stat cards */}
          <div className="adm-stat-grid">
            {STATS.map((s) => (
              <div className="adm-stat-card" key={s.label}>
                <div>
                  <div className="adm-stat-label">{s.label}</div>
                  <div
                    className="adm-stat-num"
                    style={s.red ? { color: "var(--adm-red)" } : {}}
                  >
                    {s.num}
                  </div>
                  <div className="adm-stat-sub">{s.sub}</div>
                </div>
                <i
                  className={`ti ${s.icon} adm-stat-icon`}
                  aria-hidden="true"
                />
              </div>
            ))}
          </div>

          {/* Row 1 — doctors + complaints */}
          <div className="adm-grid-2 adm-section-gap">
            <div className="adm-card">
              <div className="adm-card-header">
                <h2 className="adm-card-title">Recent doctor activity</h2>
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
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {RECENT_DOCTORS.map((d) => (
                    <tr key={d.name}>
                      <td>
                        <div className="adm-cell">
                          <div className="adm-avatar">{d.initials}</div>
                          <div>
                            <div className="adm-cell-name">{d.name}</div>
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
                        <span className={`adm-badge adm-badge-${d.status}`}>
                          {d.statusLabel}
                        </span>
                      </td>
                      <td>
                        <button
                          className="adm-icon-btn"
                          aria-label="More options"
                        >
                          <i
                            className="ti ti-dots-vertical"
                            aria-hidden="true"
                          />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="adm-card">
              <div className="adm-card-header">
                <h2 className="adm-card-title">Open complaints</h2>
                <Link to="/admin/complaints" className="adm-card-link">
                  View all →
                </Link>
              </div>
              {COMPLAINTS.map((c, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    padding: "12px 18px",
                    borderBottom:
                      i < COMPLAINTS.length - 1 ? "1px solid #f5f5f5" : "none",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: "var(--adm-text-primary)",
                        marginBottom: 3,
                      }}
                    >
                      {c.title}
                    </div>
                    <div
                      style={{ fontSize: 11, color: "var(--adm-text-muted)" }}
                    >
                      Patient {c.patient} · {c.ago}
                    </div>
                  </div>
                  <span className={`adm-badge adm-badge-${c.priority}`}>
                    {c.pLabel}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Row 2 — ratings + clinics + quick actions */}
          <div className="adm-grid-3">
            <div className="adm-card">
              <div className="adm-card-header">
                <h2 className="adm-card-title">Top rated doctors</h2>
                <Link to="/admin/ratings" className="adm-card-link">
                  View all →
                </Link>
              </div>
              {TOP_RATINGS.map((r) => (
                <div key={r.name} className="adm-metric-row">
                  <div className="adm-metric-label" style={{ width: 110 }}>
                    {r.name}
                  </div>
                  <div className="adm-bar-wrap">
                    <div className="adm-bar" style={{ width: `${r.pct}%` }} />
                  </div>
                  <div className="adm-metric-val">{r.score}</div>
                </div>
              ))}
            </div>

            <div className="adm-card">
              <div className="adm-card-header">
                <h2 className="adm-card-title">Clinic activity</h2>
                <Link to="/admin/clinics" className="adm-card-link">
                  View all →
                </Link>
              </div>
              {CLINICS.map((c, i) => (
                <div
                  key={c.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 18px",
                    borderBottom:
                      i < CLINICS.length - 1 ? "1px solid #f5f5f5" : "none",
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{c.name}</div>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <span className={`adm-badge adm-badge-${c.status}`}>
                      {c.sLabel}
                    </span>
                    <span
                      style={{ fontSize: 11, color: "var(--adm-text-muted)" }}
                    >
                      {c.appts} appts
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="adm-card">
              <div className="adm-card-header">
                <h2 className="adm-card-title">Quick actions</h2>
              </div>
              <div
                style={{
                  padding: 14,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <Link
                  to="/admin/doctors"
                  className="adm-btn adm-btn-dark"
                  style={{ justifyContent: "flex-start" }}
                >
                  <i className="ti ti-user-plus" aria-hidden="true" /> Add
                  doctor
                </Link>
                <Link
                  to="/admin/clinics"
                  className="adm-btn adm-btn-outline"
                  style={{ justifyContent: "flex-start" }}
                >
                  <i className="ti ti-building-plus" aria-hidden="true" /> New
                  clinic
                </Link>
                <Link
                  to="/admin/doctors"
                  className="adm-btn adm-btn-outline"
                  style={{ justifyContent: "flex-start" }}
                >
                  <i className="ti ti-shield-check" aria-hidden="true" /> Verify
                  credentials
                </Link>
                <Link
                  to="/admin/complaints"
                  className="adm-btn adm-btn-red"
                  style={{ justifyContent: "flex-start" }}
                >
                  <i className="ti ti-alert-triangle" aria-hidden="true" />{" "}
                  Review complaints
                </Link>
                <Link
                  to="/admin/analytics"
                  className="adm-btn adm-btn-outline"
                  style={{ justifyContent: "flex-start" }}
                >
                  <i className="ti ti-chart-bar" aria-hidden="true" /> View
                  analytics
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
