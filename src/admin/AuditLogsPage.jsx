import { useState } from "react";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";
import "../components/styles/Admin.css";

const ALL_LOGS = [
  {
    id: 1,
    action: "Doctor account suspended",
    actor: "Super Admin",
    target: "Dr. Marcus Kim",
    module: "Doctors",
    time: "Jun 7, 2026 · 14:32",
    type: "red",
  },
  {
    id: 2,
    action: "New clinic created",
    actor: "Super Admin",
    target: "West Clinic",
    module: "Clinics",
    time: "Jun 7, 2026 · 11:15",
    type: "green",
  },
  {
    id: 3,
    action: "Doctor credentials verified",
    actor: "Super Admin",
    target: "Dr. Julia Lee",
    module: "Doctors",
    time: "Jun 6, 2026 · 16:44",
    type: "teal",
  },
  {
    id: 4,
    action: "Complaint marked resolved",
    actor: "Super Admin",
    target: "Complaint #1024",
    module: "Complaints",
    time: "Jun 6, 2026 · 15:02",
    type: "green",
  },
  {
    id: 5,
    action: "Review removed",
    actor: "Super Admin",
    target: "Dr. Chen review",
    module: "Ratings",
    time: "Jun 6, 2026 · 12:30",
    type: "amber",
  },
  {
    id: 6,
    action: "Admin login",
    actor: "admin@medcenter",
    target: "Admin portal",
    module: "Auth",
    time: "Jun 6, 2026 · 09:01",
    type: "blue",
  },
  {
    id: 7,
    action: "Doctor account added",
    actor: "Super Admin",
    target: "Dr. Priya Nair",
    module: "Doctors",
    time: "Jun 5, 2026 · 17:20",
    type: "green",
  },
  {
    id: 8,
    action: "Clinic deactivated",
    actor: "Super Admin",
    target: "East Branch",
    module: "Clinics",
    time: "Jun 5, 2026 · 14:11",
    type: "red",
  },
  {
    id: 9,
    action: "Review flagged",
    actor: "Super Admin",
    target: "Dr. Tahani review",
    module: "Ratings",
    time: "Jun 5, 2026 · 11:44",
    type: "amber",
  },
  {
    id: 10,
    action: "Doctor account reactivated",
    actor: "Super Admin",
    target: "Dr. Omar Bakr",
    module: "Doctors",
    time: "Jun 4, 2026 · 16:02",
    type: "green",
  },
  {
    id: 11,
    action: "Complaint marked under review",
    actor: "Super Admin",
    target: "Complaint #1021",
    module: "Complaints",
    time: "Jun 4, 2026 · 13:30",
    type: "amber",
  },
  {
    id: 12,
    action: "Doctor assigned to clinic",
    actor: "Super Admin",
    target: "Dr. Nair → West",
    module: "Clinics",
    time: "Jun 4, 2026 · 10:15",
    type: "teal",
  },
  {
    id: 13,
    action: "Admin login",
    actor: "admin@medcenter",
    target: "Admin portal",
    module: "Auth",
    time: "Jun 4, 2026 · 09:00",
    type: "blue",
  },
  {
    id: 14,
    action: "Clinic manager updated",
    actor: "Super Admin",
    target: "North Branch",
    module: "Clinics",
    time: "Jun 3, 2026 · 15:22",
    type: "teal",
  },
  {
    id: 15,
    action: "Doctor account edited",
    actor: "Super Admin",
    target: "Dr. Ahmad Karimi",
    module: "Doctors",
    time: "Jun 3, 2026 · 11:10",
    type: "blue",
  },
  {
    id: 16,
    action: "Complaint dismissed",
    actor: "Super Admin",
    target: "Complaint #1019",
    module: "Complaints",
    time: "Jun 2, 2026 · 14:55",
    type: "gray",
  },
  {
    id: 17,
    action: "New doctor account added",
    actor: "Super Admin",
    target: "Dr. Robert Sterling",
    module: "Doctors",
    time: "Jun 1, 2026 · 16:30",
    type: "green",
  },
  {
    id: 18,
    action: "Patient record accessed",
    actor: "Dr. Ahmad",
    target: "Patient P-9284",
    module: "Records",
    time: "Jun 1, 2026 · 10:05",
    type: "blue",
  },
];

const MODULES = [
  "All",
  "Doctors",
  "Clinics",
  "Complaints",
  "Ratings",
  "Auth",
  "Records",
];
const TYPES = ["All", "Success", "Warning", "Critical"];

const TYPE_MAP = {
  green: { label: "Success", color: "adm-badge-green" },
  teal: { label: "Success", color: "adm-badge-teal" },
  blue: { label: "Info", color: "adm-badge-blue" },
  amber: { label: "Warning", color: "adm-badge-amber" },
  red: { label: "Critical", color: "adm-badge-red" },
  gray: { label: "Info", color: "adm-badge-gray" },
};

const LOG_ICON = {
  red: "ti-user-off",
  green: "ti-circle-check",
  teal: "ti-shield-check",
  amber: "ti-flag",
  blue: "ti-info-circle",
  gray: "ti-minus",
};

const ICON_STYLE = {
  red: { bg: "var(--adm-red-l)", color: "var(--adm-red)" },
  green: { bg: "var(--adm-green-light)", color: "var(--adm-green)" },
  teal: { bg: "var(--adm-teal-l)", color: "var(--adm-teal)" },
  amber: { bg: "var(--adm-amb-l)", color: "var(--adm-amber)" },
  blue: { bg: "var(--adm-blue-l)", color: "var(--adm-blue)" },
  gray: { bg: "#f0f0f0", color: "#999" },
};

export default function AuditLogsPage() {
  const [module, setModule] = useState("All");
  const [type, setType] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = ALL_LOGS.filter((log) => {
    const mOk = module === "All" || log.module === module;
    const tOk =
      type === "All" ||
      (type === "Success" && ["green", "teal"].includes(log.type)) ||
      (type === "Warning" && log.type === "amber") ||
      (type === "Critical" && log.type === "red");
    const sOk =
      search === "" ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.target.toLowerCase().includes(search.toLowerCase()) ||
      log.actor.toLowerCase().includes(search.toLowerCase());
    return mOk && tOk && sOk;
  });

  return (
    <div className="adm-shell">
      <AdminSidebar />
      <div className="adm-main">
        <AdminTopbar title="Audit Logs" searchPlaceholder="Search logs..." />
        <div className="adm-content">
          {/* Header */}
          <div className="adm-page-header">
            <div className="adm-page-header-left">
              <h1>Audit logs</h1>
              <p>
                Complete record of all admin actions taken across the system.
              </p>
            </div>
            <div className="adm-header-actions">
              <button className="adm-btn adm-btn-outline">
                <i className="ti ti-download" aria-hidden="true" /> Export logs
              </button>
            </div>
          </div>

          {/* Stat cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4,1fr)",
              gap: 14,
              marginBottom: 20,
            }}
          >
            {[
              {
                label: "Total entries",
                num: ALL_LOGS.length,
                color: "var(--adm-text-primary)",
              },
              {
                label: "Critical",
                num: ALL_LOGS.filter((l) => l.type === "red").length,
                color: "var(--adm-red)",
              },
              {
                label: "Warnings",
                num: ALL_LOGS.filter((l) => l.type === "amber").length,
                color: "var(--adm-amber)",
              },
              {
                label: "Successful",
                num: ALL_LOGS.filter((l) => ["green", "teal"].includes(l.type))
                  .length,
                color: "var(--adm-green)",
              },
            ].map((s) => (
              <div className="adm-stat-card" key={s.label}>
                <div>
                  <div className="adm-stat-label">{s.label}</div>
                  <div className="adm-stat-num" style={{ color: s.color }}>
                    {s.num}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Search + filters */}
          <div className="adm-filter-bar" style={{ marginBottom: 16 }}>
            <div style={{ position: "relative", flex: 1, maxWidth: 280 }}>
              <i
                className="ti ti-search"
                style={{
                  position: "absolute",
                  left: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--adm-text-muted)",
                  fontSize: 15,
                }}
                aria-hidden="true"
              />
              <input
                className="adm-input"
                style={{ paddingLeft: 32 }}
                placeholder="Search actions, targets, actors..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <span
              style={{
                fontSize: 12,
                color: "var(--adm-text-muted)",
                fontWeight: 500,
              }}
            >
              Module:
            </span>
            <select
              className="adm-filter-select"
              value={module}
              onChange={(e) => setModule(e.target.value)}
            >
              {MODULES.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>

            <span
              style={{
                fontSize: 12,
                color: "var(--adm-text-muted)",
                fontWeight: 500,
              }}
            >
              Type:
            </span>
            <select
              className="adm-filter-select"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              {TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>

            <button
              className="adm-btn adm-btn-outline"
              onClick={() => {
                setModule("All");
                setType("All");
                setSearch("");
              }}
            >
              <i className="ti ti-refresh" aria-hidden="true" /> Reset
            </button>
          </div>

          {/* Logs table */}
          <div className="adm-card">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Module</th>
                  <th>Performed by</th>
                  <th>Target</th>
                  <th>Type</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log) => {
                  const iconStyle = ICON_STYLE[log.type];
                  const badge = TYPE_MAP[log.type];
                  return (
                    <tr key={log.id}>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                          }}
                        >
                          <div
                            style={{
                              width: 30,
                              height: 30,
                              borderRadius: 7,
                              flexShrink: 0,
                              background: iconStyle.bg,
                              color: iconStyle.color,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 15,
                            }}
                          >
                            <i
                              className={`ti ${LOG_ICON[log.type]}`}
                              aria-hidden="true"
                            />
                          </div>
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 500,
                              color: "var(--adm-text-primary)",
                            }}
                          >
                            {log.action}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="adm-badge adm-badge-gray">
                          {log.module}
                        </span>
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
                      <td>
                        <span className={`adm-badge ${badge.color}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td
                        style={{
                          fontSize: 11,
                          color: "var(--adm-text-muted)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {log.time}
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        textAlign: "center",
                        padding: "32px",
                        color: "var(--adm-text-muted)",
                      }}
                    >
                      No logs match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="adm-table-footer">
              <span>
                Showing {filtered.length} of {ALL_LOGS.length} entries
              </span>
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
        </div>
      </div>
    </div>
  );
}
