import { useState } from "react";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";
import "../components/styles/Admin.css";

const COMPLAINTS_DATA = [
  {
    id: 1,
    title: "Missed diagnosis",
    doctor: "Dr. Marcus Kim",
    patient: "Michael Scott",
    patientId: "P-4421",
    clinic: "East Branch",
    date: "Jun 2, 2026",
    priority: "red",
    pLabel: "High",
    status: "open",
    sLabel: "Open",
    description:
      "Patient reports that doctor dismissed symptoms that later resulted in a delayed cancer diagnosis. Patient is requesting formal review and compensation.",
  },
  {
    id: 2,
    title: "Rude behaviour",
    doctor: "Dr. Chen",
    patient: "Pam Beesly",
    patientId: "P-8832",
    clinic: "City Central",
    date: "May 30, 2026",
    priority: "amber",
    pLabel: "Medium",
    status: "open",
    sLabel: "Open",
    description:
      "Patient claims the doctor was dismissive and rude during consultation. Used inappropriate language and did not explain the treatment plan adequately.",
  },
  {
    id: 3,
    title: "Late appointment",
    doctor: "Dr. Ahmad",
    patient: "Jim Halpert",
    patientId: "P-9102",
    clinic: "City Central",
    date: "May 25, 2026",
    priority: "teal",
    pLabel: "Low",
    status: "reviewing",
    sLabel: "Reviewing",
    description:
      "Doctor was 45 minutes late to a scheduled appointment with no prior notice or apology. Patient had to leave before being seen.",
  },
  {
    id: 4,
    title: "Wrong prescription",
    doctor: "Dr. Julia Lee",
    patient: "Dwight Schrute",
    patientId: "P-7761",
    clinic: "North Branch",
    date: "May 20, 2026",
    priority: "red",
    pLabel: "High",
    status: "resolved",
    sLabel: "Resolved",
    description:
      "Patient was given incorrect medication dosage. Pharmacist caught the error before dispensing. No harm resulted but formal complaint was filed.",
  },
  {
    id: 5,
    title: "Billing discrepancy",
    doctor: "Dr. Robert S.",
    patient: "Angela Martin",
    patientId: "P-3391",
    clinic: "South Branch",
    date: "May 15, 2026",
    priority: "amber",
    pLabel: "Medium",
    status: "resolved",
    sLabel: "Resolved",
    description:
      "Patient was charged for services not rendered. Invoice included two additional consultation fees not authorized by the patient.",
  },
  {
    id: 6,
    title: "Privacy breach",
    doctor: "Dr. Tahani Chen",
    patient: "Kevin Malone",
    patientId: "P-6612",
    clinic: "City Central",
    date: "May 10, 2026",
    priority: "red",
    pLabel: "High",
    status: "open",
    sLabel: "Open",
    description:
      "Doctor allegedly shared patient medical information with a family member without patient consent. Patient is requesting HIPAA investigation.",
  },
];

const PRIORITY_FILTER = ["All", "High", "Medium", "Low"];
const STATUS_FILTER = ["All", "Open", "Reviewing", "Resolved"];

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState(COMPLAINTS_DATA);
  const [priority, setPriority] = useState("All");
  const [status, setStatus] = useState("All");
  const [selected, setSelected] = useState(null);

  const filtered = complaints.filter((c) => {
    const pOk = priority === "All" || c.pLabel === priority;
    const sOk = status === "All" || c.sLabel === status;
    return pOk && sOk;
  });

  function takeAction(id, newStatus, newSLabel) {
    setComplaints((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, status: newStatus, sLabel: newSLabel } : c,
      ),
    );
    setSelected((prev) =>
      prev?.id === id
        ? { ...prev, status: newStatus, sLabel: newSLabel }
        : prev,
    );
  }

  return (
    <div className="adm-shell">
      <AdminSidebar />
      <div className="adm-main">
        <AdminTopbar
          title="Complaints & Reports"
          searchPlaceholder="Search complaints..."
        />
        <div className="adm-content">
          {/* Header */}
          <div className="adm-page-header">
            <div className="adm-page-header-left">
              <h1>Complaints &amp; reports</h1>
              <p>
                View, investigate, and take action on patient complaints and
                reports.
              </p>
            </div>
            <div className="adm-header-actions">
              <button className="adm-btn adm-btn-outline">
                <i className="ti ti-download" aria-hidden="true" /> Export
              </button>
            </div>
          </div>

          {/* Alert for high priority */}
          {complaints.filter((c) => c.pLabel === "High" && c.sLabel === "Open")
            .length > 0 && (
            <div className="adm-alert adm-alert-red">
              <i
                className="ti ti-alert-triangle"
                style={{ fontSize: 18, flexShrink: 0 }}
                aria-hidden="true"
              />
              <div>
                <strong>
                  {
                    complaints.filter(
                      (c) => c.pLabel === "High" && c.sLabel === "Open",
                    ).length
                  }{" "}
                  high-priority complaints
                </strong>{" "}
                require immediate attention.
              </div>
            </div>
          )}

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
                label: "Total",
                num: complaints.length,
                color: "var(--adm-text-primary)",
              },
              {
                label: "Open",
                num: complaints.filter((c) => c.sLabel === "Open").length,
                color: "var(--adm-red)",
              },
              {
                label: "Reviewing",
                num: complaints.filter((c) => c.sLabel === "Reviewing").length,
                color: "var(--adm-amber)",
              },
              {
                label: "Resolved",
                num: complaints.filter((c) => c.sLabel === "Resolved").length,
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

          {/* Filter bar */}
          <div className="adm-filter-bar">
            <span
              style={{
                fontSize: 12,
                color: "var(--adm-text-muted)",
                fontWeight: 500,
              }}
            >
              Priority:
            </span>
            {PRIORITY_FILTER.map((f) => (
              <button
                key={f}
                className={`adm-btn ${priority === f ? "adm-btn-dark" : "adm-btn-outline"}`}
                style={{ padding: "6px 14px", fontSize: 12 }}
                onClick={() => setPriority(f)}
              >
                {f}
              </button>
            ))}
            <span
              style={{
                fontSize: 12,
                color: "var(--adm-text-muted)",
                fontWeight: 500,
                marginLeft: 8,
              }}
            >
              Status:
            </span>
            {STATUS_FILTER.map((f) => (
              <button
                key={f}
                className={`adm-btn ${status === f ? "adm-btn-dark" : "adm-btn-outline"}`}
                style={{ padding: "6px 14px", fontSize: 12 }}
                onClick={() => setStatus(f)}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Two-col: table + detail panel */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: selected ? "1fr 360px" : "1fr",
              gap: 16,
              transition: "all 0.2s",
            }}
          >
            {/* Table */}
            <div className="adm-card">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Complaint</th>
                    <th>Doctor</th>
                    <th>Patient</th>
                    <th>Date</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr
                      key={c.id}
                      style={{
                        cursor: "pointer",
                        background: selected?.id === c.id ? "#f0f7f2" : "",
                      }}
                      onClick={() =>
                        setSelected((prev) => (prev?.id === c.id ? null : c))
                      }
                    >
                      <td>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 500,
                            color: "var(--adm-text-primary)",
                          }}
                        >
                          {c.title}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "var(--adm-text-muted)",
                          }}
                        >
                          {c.clinic}
                        </div>
                      </td>
                      <td
                        style={{
                          fontSize: 12,
                          color: "var(--adm-text-secondary)",
                        }}
                      >
                        {c.doctor}
                      </td>
                      <td>
                        <div style={{ fontSize: 12, fontWeight: 500 }}>
                          {c.patient}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "var(--adm-text-muted)",
                          }}
                        >
                          {c.patientId}
                        </div>
                      </td>
                      <td
                        style={{ fontSize: 12, color: "var(--adm-text-muted)" }}
                      >
                        {c.date}
                      </td>
                      <td>
                        <span className={`adm-badge adm-badge-${c.priority}`}>
                          {c.pLabel}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`adm-badge ${c.sLabel === "Resolved" ? "adm-badge-green" : c.sLabel === "Reviewing" ? "adm-badge-amber" : "adm-badge-red"}`}
                        >
                          {c.sLabel}
                        </span>
                      </td>
                      <td>
                        <button
                          className="adm-icon-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelected((prev) =>
                              prev?.id === c.id ? null : c,
                            );
                          }}
                        >
                          <i
                            className="ti ti-chevron-right"
                            aria-hidden="true"
                          />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="adm-table-footer">
                <span>
                  Showing {filtered.length} of {complaints.length} complaints
                </span>
                <div className="adm-pagination">
                  <button className="adm-page-btn active">1</button>
                </div>
              </div>
            </div>

            {/* Detail panel */}
            {selected && (
              <div
                className="adm-card"
                style={{ height: "fit-content", position: "sticky", top: 86 }}
              >
                <div className="adm-card-header">
                  <h2 className="adm-card-title">Complaint detail</h2>
                  <button
                    className="adm-icon-btn"
                    onClick={() => setSelected(null)}
                  >
                    <i className="ti ti-x" aria-hidden="true" />
                  </button>
                </div>

                <div
                  style={{
                    padding: "16px 18px",
                    borderBottom: "1px solid var(--adm-card-border)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 10,
                    }}
                  >
                    <span
                      className={`adm-badge adm-badge-${selected.priority}`}
                    >
                      {selected.pLabel} Priority
                    </span>
                    <span
                      className={`adm-badge ${selected.sLabel === "Resolved" ? "adm-badge-green" : selected.sLabel === "Reviewing" ? "adm-badge-amber" : "adm-badge-red"}`}
                    >
                      {selected.sLabel}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 600,
                      color: "var(--adm-text-primary)",
                      marginBottom: 4,
                    }}
                  >
                    {selected.title}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--adm-text-muted)" }}>
                    Filed on {selected.date}
                  </div>
                </div>

                <div
                  style={{
                    padding: "14px 18px",
                    borderBottom: "1px solid var(--adm-card-border)",
                  }}
                >
                  <div className="adm-info-row">
                    <span className="adm-info-label">Doctor</span>
                    <span className="adm-info-value">{selected.doctor}</span>
                  </div>
                  <div className="adm-info-row">
                    <span className="adm-info-label">Patient</span>
                    <span className="adm-info-value">{selected.patient}</span>
                  </div>
                  <div className="adm-info-row">
                    <span className="adm-info-label">Patient ID</span>
                    <span className="adm-info-value">{selected.patientId}</span>
                  </div>
                  <div className="adm-info-row">
                    <span className="adm-info-label">Clinic</span>
                    <span className="adm-info-value">{selected.clinic}</span>
                  </div>
                </div>

                <div
                  style={{
                    padding: "14px 18px",
                    borderBottom: "1px solid var(--adm-card-border)",
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "var(--adm-text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      marginBottom: 8,
                    }}
                  >
                    Description
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: "var(--adm-text-secondary)",
                      lineHeight: 1.65,
                      fontWeight: 300,
                    }}
                  >
                    {selected.description}
                  </div>
                </div>

                <div style={{ padding: "14px 18px" }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "var(--adm-text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      marginBottom: 10,
                    }}
                  >
                    Take action
                  </div>
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 8 }}
                  >
                    {selected.sLabel !== "Reviewing" && (
                      <button
                        className="adm-btn adm-btn-amber"
                        style={{ justifyContent: "flex-start" }}
                        onClick={() =>
                          takeAction(selected.id, "reviewing", "Reviewing")
                        }
                      >
                        <i className="ti ti-search" aria-hidden="true" /> Mark
                        as under review
                      </button>
                    )}
                    {selected.sLabel !== "Resolved" && (
                      <button
                        className="adm-btn adm-btn-green"
                        style={{ justifyContent: "flex-start" }}
                        onClick={() =>
                          takeAction(selected.id, "resolved", "Resolved")
                        }
                      >
                        <i className="ti ti-circle-check" aria-hidden="true" />{" "}
                        Mark as resolved
                      </button>
                    )}
                    <button
                      className="adm-btn adm-btn-dark"
                      style={{ justifyContent: "flex-start" }}
                    >
                      <i className="ti ti-user-off" aria-hidden="true" />{" "}
                      Suspend doctor
                    </button>
                    <button
                      className="adm-btn adm-btn-outline"
                      style={{ justifyContent: "flex-start" }}
                    >
                      <i className="ti ti-message-circle" aria-hidden="true" />{" "}
                      Contact patient
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
