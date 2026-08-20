import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { useClinic } from "../context/ClinicContext";
import "./styles/Layout.css";
import "./styles/Appointments.css";
import { getDoctorAppointments } from "../api/Appointments";

const STATUS_META = {
  scheduled: { label: "Scheduled", badge: "scheduled" },
  checked_in: { label: "Checked-in", badge: "checked-in" },
  in_progress: { label: "In progress", badge: "in-progress" },
  completed: { label: "Completed", badge: "completed" },
  cancelled: { label: "Cancelled", badge: "cancelled" },
  no_show: { label: "No-show", badge: "no-show" },
};

function initialsOf(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return `${first}${last}`.toUpperCase() || "?";
}

function formatTime(slot) {
  if (!slot?.starts_at) return "Walk-in";
  const d = new Date(slot.starts_at);
  if (Number.isNaN(d.getTime())) return slot.starts_at;
  return d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

function getDateLabel() {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const { selectedClinic, selectedClinicId, clinics } = useClinic();

  const [allToday, setAllToday] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    setLoading(true);
    setLoadError("");
    // The doctor appointments endpoint has no clinic_id filter — it
    // returns every clinic's appointments mixed together. Fetch today's
    // appointments once and filter to the selected clinic client-side.
    // per_page is capped at 50 server-side (paginate_per_page's $max) —
    // a doctor with more than 50 appointments across all their clinics
    // in a single day would need a second page, not handled here.
    getDoctorAppointments({ date: todayISO(), per_page: 50 })
      .then((result) => setAllToday(result.items))
      .catch((err) =>
        setLoadError(err.message || "Couldn't load today's appointments."),
      )
      .finally(() => setLoading(false));
  }, []);

  const scoped = selectedClinicId
    ? allToday.filter((a) => a.clinic?.id === selectedClinicId)
    : allToday;

  const completedCount = scoped.filter((a) => a.status === "completed").length;
  const remainingCount = scoped.filter((a) =>
    ["scheduled", "checked_in", "in_progress"].includes(a.status),
  ).length;

  const STATS = [
    {
      icon: "ti-calendar-event",
      color: "teal",
      num: scoped.length,
      label: "Today's Appointments",
    },
    {
      icon: "ti-circle-check",
      color: "green",
      num: completedCount,
      label: "Completed",
    },
    {
      icon: "ti-hourglass",
      color: "amber",
      num: remainingCount,
      label: "Remaining",
    },
  ];

  const preview = [...scoped]
    .sort((a, b) => {
      const ta = a.slot?.starts_at ? new Date(a.slot.starts_at).getTime() : 0;
      const tb = b.slot?.starts_at ? new Date(b.slot.starts_at).getTime() : 0;
      return ta - tb;
    })
    .slice(0, 8);

  return (
    <div className="layout-shell">
      <Sidebar />

      <div className="layout-main">
        <Topbar searchPlaceholder="Search patients..." />

        <main className="page-content">
          <div className="page-header">
            <div className="page-header-left">
              <h1>{getGreeting()}</h1>
              <p>
                {selectedClinic
                  ? `Here's an overview of your schedule at ${selectedClinic.clinic_name} today.`
                  : "Here's an overview of your schedule for today."}
              </p>
            </div>
            <div className="date-badge">
              <i className="ti ti-calendar" aria-hidden="true" />
              {getDateLabel()}
            </div>
          </div>

          {clinics.length === 0 && !loading && (
            <div className="apt-banner apt-banner-error">
              You're not linked to any clinic yet — join or create one from your
              profile page first.
            </div>
          )}

          {loadError && (
            <div className="apt-banner apt-banner-error">{loadError}</div>
          )}

          {clinics.length > 0 && (
            <>
              <div className="stat-cards">
                {STATS.map(({ icon, color, num, label }) => (
                  <div className="stat-card" key={label}>
                    <div className={`stat-card-icon ${color}`}>
                      <i className={`ti ${icon}`} aria-hidden="true" />
                    </div>
                    <div className="stat-card-num">{loading ? "—" : num}</div>
                    <div className="stat-card-label">{label}</div>
                  </div>
                ))}
              </div>

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
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && (
                      <tr>
                        <td
                          colSpan={4}
                          style={{
                            textAlign: "center",
                            padding: 24,
                            color: "var(--text-muted)",
                          }}
                        >
                          Loading…
                        </td>
                      </tr>
                    )}
                    {!loading && preview.length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          style={{
                            textAlign: "center",
                            padding: 24,
                            color: "var(--text-muted)",
                          }}
                        >
                          No appointments today at this clinic.
                        </td>
                      </tr>
                    )}
                    {preview.map((apt) => {
                      const meta = STATUS_META[apt.status] || {
                        label: apt.status,
                        badge: apt.status,
                      };
                      return (
                        <tr key={apt.id}>
                          <td>
                            <div className="patient-cell">
                              <div className="patient-avatar">
                                {initialsOf(apt.patient?.name)}
                              </div>
                              <div>
                                <div className="patient-name">
                                  {apt.patient?.name || "—"}
                                </div>
                                <div className="patient-id">
                                  ID: {apt.patient?.id ?? "—"}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>{formatTime(apt.slot)}</td>
                          <td>
                            <span className={`badge badge-${meta.badge}`}>
                              {meta.label}
                            </span>
                          </td>
                          <td>
                            <button
                              className="btn-ghost"
                              onClick={() =>
                                navigate("/appointments", {
                                  state: { highlightId: apt.id },
                                })
                              }
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
