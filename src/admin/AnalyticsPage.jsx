import { useState } from "react";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";
import "../components/styles/Admin.css";

/* ── Mock data ─────────────────────────────────────────── */
const MONTHLY_APPTS = [
  { month: "Jan", count: 312, revenue: 46800 },
  { month: "Feb", count: 287, revenue: 43050 },
  { month: "Mar", count: 345, revenue: 51750 },
  { month: "Apr", count: 398, revenue: 59700 },
  { month: "May", count: 421, revenue: 63150 },
  { month: "Jun", count: 389, revenue: 58350 },
];

const DOCTOR_PERFORMANCE = [
  {
    initials: "DA",
    name: "Dr. Ahmad",
    spec: "Cardiology",
    appts: 124,
    rating: 4.9,
    revenue: 18600,
    completion: 96,
  },
  {
    initials: "DC",
    name: "Dr. Chen",
    spec: "Pediatrics",
    appts: 98,
    rating: 4.6,
    revenue: 14700,
    completion: 92,
  },
  {
    initials: "TA",
    name: "Dr. Tahani",
    spec: "Dermatology",
    appts: 86,
    rating: 4.2,
    revenue: 12900,
    completion: 88,
  },
  {
    initials: "RS",
    name: "Dr. Sterling",
    spec: "Orthopedics",
    appts: 74,
    rating: 4.0,
    revenue: 11100,
    completion: 85,
  },
  {
    initials: "MK",
    name: "Dr. Marcus Kim",
    spec: "General",
    appts: 42,
    rating: 2.8,
    revenue: 6300,
    completion: 71,
  },
];

const USER_ENGAGEMENT = [
  { label: "New patients this month", value: 148, change: "+12%", up: true },
  { label: "Returning patients", value: 892, change: "+5%", up: true },
  { label: "Appointment completion", value: "89%", change: "+2%", up: true },
  { label: "No-show rate", value: "11%", change: "-3%", up: false },
  { label: "Avg session duration", value: "22m", change: "+1m", up: true },
  { label: "Portal logins this week", value: 1204, change: "+18%", up: true },
];

const AUDIT_LOGS = [
  {
    id: 1,
    action: "Doctor account suspended",
    actor: "Super Admin",
    target: "Dr. Marcus Kim",
    time: "Jun 7, 2026 · 14:32",
    type: "red",
  },
  {
    id: 2,
    action: "New clinic created",
    actor: "Super Admin",
    target: "West Clinic",
    time: "Jun 7, 2026 · 11:15",
    type: "green",
  },
  {
    id: 3,
    action: "Doctor credentials verified",
    actor: "Super Admin",
    target: "Dr. Julia Lee",
    time: "Jun 6, 2026 · 16:44",
    type: "teal",
  },
  {
    id: 4,
    action: "Complaint marked resolved",
    actor: "Super Admin",
    target: "Complaint #1024",
    time: "Jun 6, 2026 · 15:02",
    type: "green",
  },
  {
    id: 5,
    action: "Review removed",
    actor: "Super Admin",
    target: "Dr. Chen review",
    time: "Jun 6, 2026 · 12:30",
    type: "amber",
  },
  {
    id: 6,
    action: "Admin login",
    actor: "admin@medcenter",
    target: "Admin portal",
    time: "Jun 6, 2026 · 09:01",
    type: "blue",
  },
  {
    id: 7,
    action: "Doctor account added",
    actor: "Super Admin",
    target: "Dr. Priya Nair",
    time: "Jun 5, 2026 · 17:20",
    type: "green",
  },
  {
    id: 8,
    action: "Clinic deactivated",
    actor: "Super Admin",
    target: "East Branch",
    time: "Jun 5, 2026 · 14:11",
    type: "red",
  },
];

const APPT_BY_TYPE = [
  { type: "Annual Physical", count: 421, pct: 32 },
  { type: "Follow-up", count: 389, pct: 29 },
  { type: "Consultation", count: 312, pct: 24 },
  { type: "Lab Review", count: 156, pct: 12 },
  { type: "Emergency", count: 42, pct: 3 },
];

const LOG_ICON = {
  red: "ti-user-off",
  green: "ti-circle-check",
  teal: "ti-shield-check",
  amber: "ti-flag",
  blue: "ti-login",
};

/* ── Mini bar chart ────────────────────────────────────── */
function MiniBarChart({ data, valueKey, color = "var(--adm-dark)" }) {
  const max = Math.max(...data.map((d) => d[valueKey]));
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: 6,
        height: 80,
        padding: "0 18px 0",
      }}
    >
      {data.map((d) => (
        <div
          key={d.month}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
          }}
        >
          <div
            style={{
              width: "100%",
              background: color,
              borderRadius: "3px 3px 0 0",
              height: `${Math.round((d[valueKey] / max) * 64)}px`,
              opacity: 0.85,
              transition: "height 0.3s",
            }}
          />
          <span style={{ fontSize: 10, color: "var(--adm-text-muted)" }}>
            {d.month}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── Main page ─────────────────────────────────────────── */
export default function AnalyticsPage() {
  const [tab, setTab] = useState("overview");
  const [period, setPeriod] = useState("6 months");

  const totalAppts = MONTHLY_APPTS.reduce((a, m) => a + m.count, 0);
  const totalRevenue = MONTHLY_APPTS.reduce((a, m) => a + m.revenue, 0);

  return (
    <div className="adm-shell">
      <AdminSidebar />
      <div className="adm-main">
        <AdminTopbar
          title="Analytics"
          searchPlaceholder="Search analytics..."
        />
        <div className="adm-content">
          {/* Header */}
          <div className="adm-page-header">
            <div className="adm-page-header-left">
              <h1>Analytics dashboard</h1>
              <p>
                Appointments, revenue, doctor performance, user engagement, and
                audit logs.
              </p>
            </div>
            <div className="adm-header-actions">
              <select
                className="adm-filter-select"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
              >
                <option>6 months</option>
                <option>3 months</option>
                <option>This year</option>
              </select>
              <button className="adm-btn adm-btn-outline">
                <i className="ti ti-download" aria-hidden="true" /> Export
              </button>
            </div>
          </div>

          {/* Top stat cards */}
          <div className="adm-stat-grid" style={{ marginBottom: 20 }}>
            {[
              {
                label: "Total appointments",
                num: totalAppts,
                sub: "Last 6 months",
                icon: "ti-calendar-event",
              },
              {
                label: "Total revenue",
                num: `$${totalRevenue.toLocaleString()}`,
                sub: "Last 6 months",
                icon: "ti-currency-dollar",
              },
              {
                label: "Avg per month",
                num: Math.round(totalAppts / 6),
                sub: "Appointments / month",
                icon: "ti-chart-bar",
              },
              {
                label: "Active doctors",
                num: 5,
                sub: "Contributing to data",
                icon: "ti-stethoscope",
              },
            ].map((s) => (
              <div className="adm-stat-card" key={s.label}>
                <div>
                  <div className="adm-stat-label">{s.label}</div>
                  <div className="adm-stat-num">{s.num}</div>
                  <div className="adm-stat-sub">{s.sub}</div>
                </div>
                <i
                  className={`ti ${s.icon} adm-stat-icon`}
                  aria-hidden="true"
                />
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="adm-tabs">
            {[
              "overview",
              "doctor performance",
              "user engagement",
              "audit logs",
            ].map((t) => (
              <button
                key={t}
                className={`adm-tab${tab === t ? " active" : ""}`}
                onClick={() => setTab(t)}
                style={{ textTransform: "capitalize" }}
              >
                {t}
              </button>
            ))}
          </div>

          {/* ── Overview tab ── */}
          {tab === "overview" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="adm-grid-2">
                {/* Appointments chart */}
                <div className="adm-card">
                  <div className="adm-card-header">
                    <h2 className="adm-card-title">Appointments per month</h2>
                    <span
                      style={{ fontSize: 12, color: "var(--adm-text-muted)" }}
                    >
                      Last 6 months
                    </span>
                  </div>
                  <div style={{ paddingTop: 16 }}>
                    <MiniBarChart
                      data={MONTHLY_APPTS}
                      valueKey="count"
                      color="var(--adm-dark)"
                    />
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(6,1fr)",
                      padding: "12px 18px",
                      borderTop: "1px solid var(--adm-card-border)",
                    }}
                  >
                    {MONTHLY_APPTS.map((m) => (
                      <div key={m.month} style={{ textAlign: "center" }}>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: "var(--adm-text-primary)",
                          }}
                        >
                          {m.count}
                        </div>
                        <div
                          style={{
                            fontSize: 10,
                            color: "var(--adm-text-muted)",
                          }}
                        >
                          {m.month}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Revenue chart */}
                <div className="adm-card">
                  <div className="adm-card-header">
                    <h2 className="adm-card-title">Revenue per month</h2>
                    <span
                      style={{ fontSize: 12, color: "var(--adm-text-muted)" }}
                    >
                      Last 6 months
                    </span>
                  </div>
                  <div style={{ paddingTop: 16 }}>
                    <MiniBarChart
                      data={MONTHLY_APPTS}
                      valueKey="revenue"
                      color="var(--adm-green)"
                    />
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(6,1fr)",
                      padding: "12px 18px",
                      borderTop: "1px solid var(--adm-card-border)",
                    }}
                  >
                    {MONTHLY_APPTS.map((m) => (
                      <div key={m.month} style={{ textAlign: "center" }}>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: "var(--adm-text-primary)",
                          }}
                        >
                          ${(m.revenue / 1000).toFixed(1)}k
                        </div>
                        <div
                          style={{
                            fontSize: 10,
                            color: "var(--adm-text-muted)",
                          }}
                        >
                          {m.month}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Appointment types */}
              <div className="adm-card">
                <div className="adm-card-header">
                  <h2 className="adm-card-title">Appointments by type</h2>
                </div>
                <div style={{ padding: "8px 0" }}>
                  {APPT_BY_TYPE.map((a) => (
                    <div key={a.type} className="adm-metric-row">
                      <div className="adm-metric-label">{a.type}</div>
                      <div className="adm-bar-wrap">
                        <div
                          className="adm-bar"
                          style={{ width: `${a.pct}%` }}
                        />
                      </div>
                      <div className="adm-metric-val">{a.count}</div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--adm-text-muted)",
                          width: 32,
                          textAlign: "right",
                        }}
                      >
                        {a.pct}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Doctor performance tab ── */}
          {tab === "doctor performance" && (
            <div className="adm-card">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Doctor</th>
                    <th>Appointments</th>
                    <th>Rating</th>
                    <th>Revenue</th>
                    <th>Completion rate</th>
                  </tr>
                </thead>
                <tbody>
                  {DOCTOR_PERFORMANCE.map((d) => (
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
                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                          }}
                        >
                          <div className="adm-bar-wrap" style={{ width: 80 }}>
                            <div
                              className="adm-bar"
                              style={{
                                width: `${Math.round((d.appts / 124) * 100)}%`,
                              }}
                            />
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 500 }}>
                            {d.appts}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <span style={{ color: "#f59e0b" }}>★</span>
                          <span style={{ fontSize: 13, fontWeight: 600 }}>
                            {d.rating}
                          </span>
                        </div>
                      </td>
                      <td style={{ fontSize: 13, fontWeight: 500 }}>
                        ${d.revenue.toLocaleString()}
                      </td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                          }}
                        >
                          <div className="adm-bar-wrap" style={{ width: 80 }}>
                            <div
                              className="adm-bar"
                              style={{
                                width: `${d.completion}%`,
                                background:
                                  d.completion < 80
                                    ? "var(--adm-red)"
                                    : "var(--adm-green)",
                              }}
                            />
                          </div>
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 500,
                              color:
                                d.completion < 80
                                  ? "var(--adm-red)"
                                  : "var(--adm-text-primary)",
                            }}
                          >
                            {d.completion}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── User engagement tab ── */}
          {tab === "user engagement" && (
            <div className="adm-grid-2">
              {USER_ENGAGEMENT.map((u) => (
                <div className="adm-stat-card" key={u.label}>
                  <div>
                    <div className="adm-stat-label">{u.label}</div>
                    <div className="adm-stat-num">{u.value}</div>
                    <div
                      style={{
                        fontSize: 12,
                        marginTop: 4,
                        color: u.up ? "var(--adm-green)" : "var(--adm-red)",
                        fontWeight: 500,
                      }}
                    >
                      {u.change} vs last period
                    </div>
                  </div>
                  <i
                    className={`ti ${u.up ? "ti-trending-up" : "ti-trending-down"} adm-stat-icon`}
                    style={{ color: u.up ? "#86efac" : "#fca5a5" }}
                    aria-hidden="true"
                  />
                </div>
              ))}
            </div>
          )}

          {/* ── Audit logs tab ── */}
          {tab === "audit logs" && (
            <div className="adm-card">
              <div className="adm-card-header">
                <h2 className="adm-card-title">Audit logs</h2>
                <span style={{ fontSize: 12, color: "var(--adm-text-muted)" }}>
                  Last 30 days
                </span>
              </div>
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Action</th>
                    <th>Performed by</th>
                    <th>Target</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {AUDIT_LOGS.map((log) => (
                    <tr key={log.id}>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 9,
                          }}
                        >
                          <div
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 7,
                              background:
                                log.type === "red"
                                  ? "var(--adm-red-l)"
                                  : log.type === "green"
                                    ? "var(--adm-green-light)"
                                    : log.type === "teal"
                                      ? "var(--adm-teal-l)"
                                      : log.type === "amber"
                                        ? "var(--adm-amb-l)"
                                        : "var(--adm-blue-l)",
                              color:
                                log.type === "red"
                                  ? "var(--adm-red)"
                                  : log.type === "green"
                                    ? "var(--adm-green)"
                                    : log.type === "teal"
                                      ? "var(--adm-teal)"
                                      : log.type === "amber"
                                        ? "var(--adm-amber)"
                                        : "var(--adm-blue)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 14,
                              flexShrink: 0,
                            }}
                          >
                            <i
                              className={`ti ${LOG_ICON[log.type]}`}
                              aria-hidden="true"
                            />
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 500 }}>
                            {log.action}
                          </span>
                        </div>
                      </td>
                      <td
                        style={{
                          fontSize: 12,
                          color: "var(--adm-text-secondary)",
                        }}
                      >
                        {log.actor}
                      </td>
                      <td
                        style={{
                          fontSize: 12,
                          color: "var(--adm-text-secondary)",
                        }}
                      >
                        {log.target}
                      </td>
                      <td
                        style={{ fontSize: 11, color: "var(--adm-text-muted)" }}
                      >
                        {log.time}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="adm-table-footer">
                <span>Showing {AUDIT_LOGS.length} recent entries</span>
                <div className="adm-pagination">
                  <button className="adm-page-btn">
                    <i className="ti ti-chevron-left" />
                  </button>
                  <button className="adm-page-btn active">1</button>
                  <button className="adm-page-btn">2</button>
                  <button className="adm-page-btn">
                    <i className="ti ti-chevron-right" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
