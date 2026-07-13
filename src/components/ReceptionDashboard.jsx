import { useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import "./styles/Layout.css";
import "./styles/ReceptionDashboard.css";

/* ── Mock data ─────────────────────────────────────────── */
const CURRENT_USER = {
  name: "Sarah Jenkins",
  role: "Head Receptionist",
  initials: "SJ",
};

const TABS = [
  { to: "/dashboard", label: "Doctor Portal" },
  { to: "/reception", label: "Reception" },
  { to: "/analytics", label: "Analytics" },
];

const STATS = [
  {
    label: "Total Appointments",
    num: 42,
    sub: "+5 from yesterday",
    icon: "ti-calendar-check",
  },
  { label: "Checked-in", num: 15, sub: null, icon: "ti-user-check" },
  { label: "Waiting", num: 3, sub: null, icon: "ti-hourglass" },
  { label: "No-show", num: 2, sub: null, icon: "ti-user-off" },
];

const DOCTORS = [
  {
    id: 1,
    name: "Dr. Ahmad",
    initials: "DA",
    specialty: "Cardiology",
    status: "available",
    statusLabel: "AVAILABLE",
    appts: 12,
    waiting: 1,
  },
  {
    id: 2,
    name: "Dr. Chen",
    initials: "DC",
    specialty: "Pediatrics",
    status: "busy",
    statusLabel: "BUSY",
    appts: 18,
    waiting: 2,
  },
  {
    id: 3,
    name: "Dr. Sarah Jenkins",
    initials: "SJ",
    specialty: "General Practice",
    status: "available",
    statusLabel: "AVAILABLE",
    appts: 8,
    waiting: 0,
  },
  {
    id: 4,
    name: "Dr. Tahani Al-Jamil",
    initials: "TA",
    specialty: "Dermatology",
    status: "busy",
    statusLabel: "BUSY",
    appts: 14,
    waiting: 3,
  },
];

const QUEUE = [
  {
    id: 1,
    time: "09:30 AM",
    name: "Michael Scott",
    patientId: "P-4421",
    initials: "MS",
    doctor: "Dr. Ahmad",
    status: "checked-in",
    statusLabel: "Checked In",
  },
  {
    id: 2,
    time: "10:00 AM",
    name: "Pam Beesly",
    patientId: "P-8832",
    initials: "PB",
    doctor: "Dr. Chen",
    status: "scheduled",
    statusLabel: "Expected",
  },
  {
    id: 3,
    time: "10:15 AM",
    name: "Jim Halpert",
    patientId: "P-9102",
    initials: "JH",
    doctor: "Dr. Ahmad",
    status: "scheduled",
    statusLabel: "Expected",
  },
  {
    id: 4,
    time: "10:30 AM",
    name: "Dwight Schrute",
    patientId: "P-7761",
    initials: "DS",
    doctor: "Dr. Tahani Al-Jamil",
    status: "waiting",
    statusLabel: "Waiting",
  },
  {
    id: 5,
    time: "11:00 AM",
    name: "Angela Martin",
    patientId: "P-3391",
    initials: "AM",
    doctor: "Dr. Chen",
    status: "scheduled",
    statusLabel: "Expected",
  },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function getDate() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/* ── Main page ─────────────────────────────────────────── */
export default function ReceptionDashboard() {
  const [findPatient, setFindPatient] = useState("");

  return (
    <div className="layout-shell">
      <Sidebar user={CURRENT_USER} />

      <div className="layout-main">
        <Topbar
          user={CURRENT_USER}
          tabs={TABS}
          searchPlaceholder="Search patients..."
        />

        <main className="page-content">
          {/* Page header */}
          <div className="page-header">
            <div className="page-header-left">
              <h1>
                {getGreeting()}, {CURRENT_USER.name.split(" ")[0]}.
              </h1>
              <p>Here is the overview for today's clinic operations.</p>
            </div>
            <div className="date-badge">
              <i className="ti ti-calendar" aria-hidden="true" />
              {getDate()}
            </div>
          </div>

          {/* Stat cards */}
          <div className="reception-stats">
            {STATS.map(({ label, num, sub, icon }) => (
              <div className="reception-stat-card" key={label}>
                <div className="reception-stat-left">
                  <div className="reception-stat-label">{label}</div>
                  <div className="reception-stat-num">
                    {num}
                    {sub && <span className="reception-stat-sub">{sub}</span>}
                  </div>
                </div>
                <i
                  className={`ti ${icon} reception-stat-icon`}
                  aria-hidden="true"
                />
              </div>
            ))}
          </div>

          {/* Two-col layout */}
          <div className="reception-layout">
            <div>
              {/* On Duty Today */}
              <div className="section-header">
                <h2 className="section-title">On Duty Today</h2>
                <button
                  className="card-link"
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  View All Schedule
                </button>
              </div>

              <div className="doctor-cards">
                {DOCTORS.map((doc) => (
                  <div className="doctor-card" key={doc.id}>
                    <div className="doctor-card-avatar">
                      {doc.initials}
                      <div className={`doctor-online-dot ${doc.status}`} />
                    </div>
                    <div className="doctor-card-body">
                      <div className="doctor-card-top">
                        <span className="doctor-card-name">{doc.name}</span>
                        <span className={`avail-badge ${doc.status}`}>
                          {doc.statusLabel}
                        </span>
                      </div>
                      <div className="doctor-card-specialty">
                        {doc.specialty}
                      </div>
                      <div className="doctor-card-stats">
                        <div className="doctor-stat">
                          <span className="doctor-stat-num">{doc.appts}</span>
                          <span className="doctor-stat-label">Appts</span>
                        </div>
                        <div className="doctor-stat">
                          <span className="doctor-stat-num">{doc.waiting}</span>
                          <span className="doctor-stat-label">Waiting</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Upcoming Queue */}
              <div className="queue-card">
                <div className="queue-card-header">
                  <span className="queue-card-title">Upcoming Queue</span>
                  <div className="queue-card-icons">
                    <button className="icon-btn" aria-label="Filter">
                      <i
                        className="ti ti-adjustments-horizontal"
                        aria-hidden="true"
                      />
                    </button>
                    <button className="icon-btn" aria-label="Refresh">
                      <i className="ti ti-refresh" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Patient</th>
                      <th>Doctor</th>
                      <th>Status</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {QUEUE.map((row) => (
                      <tr key={row.id}>
                        <td style={{ fontSize: 14, fontWeight: 500 }}>
                          {row.time}
                        </td>
                        <td>
                          <div className="patient-cell">
                            <div className="patient-avatar">{row.initials}</div>
                            <div>
                              <div className="patient-name">{row.name}</div>
                              <div className="patient-id">
                                ID: {row.patientId}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td
                          style={{
                            fontSize: 13,
                            color: "var(--text-secondary)",
                          }}
                        >
                          {row.doctor}
                        </td>
                        <td>
                          <span className={`badge badge-${row.status}`}>
                            {row.statusLabel}
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            className="icon-btn"
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

                <div className="queue-card-footer">
                  <button className="queue-view-all">
                    View All 42 Appointments
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Actions sidebar */}
            <div className="quick-actions-card">
              <div className="quick-actions-header">Quick Actions</div>
              <div className="quick-actions-body">
                <button className="quick-action-btn dark">
                  <i className="ti ti-user-check" aria-hidden="true" />
                  Patient Check-In
                </button>
                <button className="quick-action-btn outline">
                  <i className="ti ti-calendar-event" aria-hidden="true" />
                  Reschedule Appt
                </button>
                <button className="quick-action-btn outline">
                  <i className="ti ti-user-off" aria-hidden="true" />
                  Mark No-Show
                </button>

                <div className="quick-actions-divider" />

                <div className="find-patient-label">Find Patient</div>
                <div className="find-patient-input">
                  <i className="ti ti-search" aria-hidden="true" />
                  <input
                    type="text"
                    placeholder="Name, ID, or Phone..."
                    value={findPatient}
                    onChange={(e) => setFindPatient(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
