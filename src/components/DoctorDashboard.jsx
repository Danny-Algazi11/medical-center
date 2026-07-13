import { Link } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import "./styles/Layout.css";

/* ── Mock data ─────────────────────────────────────────── */
const CURRENT_USER = {
  name: "Dr. Ahmad",
  role: "Doctor Portal",
  initials: "DA",
};

const TABS = [
  { to: "/dashboard", label: "Doctor Portal" },
  { to: "/reception", label: "Reception" },
  { to: "/analytics", label: "Analytics" },
];

const STATS = [
  {
    icon: "ti-calendar-event",
    color: "teal",
    num: 24,
    label: "Today's Appointments",
  },
  { icon: "ti-circle-check", color: "green", num: 18, label: "Completed" },
  { icon: "ti-hourglass", color: "amber", num: 6, label: "Remaining" },
  { icon: "ti-mail", color: "red", num: 4, label: "Unread Messages" },
];

const APPOINTMENTS = [
  {
    id: "P-9284",
    name: "Sarah Jenkins",
    initials: "SJ",
    time: "09:30 AM",
    status: "checked-in",
    statusLabel: "Checked-in",
    action: "workflow",
  },
  {
    id: "P-8372",
    name: "Marcus Kim",
    initials: "MK",
    time: "10:00 AM",
    status: "scheduled",
    statusLabel: "Scheduled",
    action: "prepare",
  },
  {
    id: "P-1029",
    name: "Emma Woods",
    initials: "EW",
    time: "08:45 AM",
    status: "completed",
    statusLabel: "Completed",
    action: "notes",
  },
  {
    id: "P-7741",
    name: "James Ortega",
    initials: "JO",
    time: "11:00 AM",
    status: "scheduled",
    statusLabel: "Scheduled",
    action: "prepare",
  },
  {
    id: "P-5530",
    name: "Priya Nair",
    initials: "PN",
    time: "11:30 AM",
    status: "waiting",
    statusLabel: "Waiting",
    action: "workflow",
  },
];

function getDate() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

/* ── Action button per row ─────────────────────────────── */
function ActionBtn({ type }) {
  if (type === "workflow") {
    return (
      <button className="btn-dark">
        <i className="ti ti-player-play" aria-hidden="true" />
        Open Workflow
      </button>
    );
  }
  if (type === "prepare") {
    return <button className="btn-outline">Prepare</button>;
  }
  return <button className="btn-ghost">View Notes</button>;
}

/* ── Page ──────────────────────────────────────────────── */
export default function DoctorDashboard() {
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
          {/* Header */}
          <div className="page-header">
            <div className="page-header-left">
              <h1>{getGreeting()}, Dr. Ahmad</h1>
              <p>Here is an overview of your schedule for today.</p>
            </div>
            <div className="date-badge">
              <i className="ti ti-calendar" aria-hidden="true" />
              {getDate()}
            </div>
          </div>

          {/* Stat cards */}
          <div className="stat-cards">
            {STATS.map(({ icon, color, num, label }) => (
              <div className="stat-card" key={label}>
                <div className={`stat-card-icon ${color}`}>
                  <i className={`ti ${icon}`} aria-hidden="true" />
                </div>
                <div className="stat-card-num">{num}</div>
                <div className="stat-card-label">{label}</div>
              </div>
            ))}
          </div>

          {/* Appointments table */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Today's Appointments Preview</h2>
              <Link to="/appointments" className="card-link">
                View Full Schedule
              </Link>
            </div>

            <table className="data-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Time</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {APPOINTMENTS.map((apt) => (
                  <tr key={apt.id}>
                    <td>
                      <div className="patient-cell">
                        <div className="patient-avatar">{apt.initials}</div>
                        <div>
                          <div className="patient-name">{apt.name}</div>
                          <div className="patient-id">ID: {apt.id}</div>
                        </div>
                      </div>
                    </td>
                    <td>{apt.time}</td>
                    <td>
                      <span className={`badge badge-${apt.status}`}>
                        {apt.statusLabel}
                      </span>
                    </td>
                    <td>
                      <ActionBtn type={apt.action} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}
