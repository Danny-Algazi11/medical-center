import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { useAuth } from "../context/AuthContext";
import "./styles/Layout.css";
import "./styles/ReceptionDashboard.css";
import "./styles/Appointments.css";
import {
  getReceptionistAppointments,
  checkInAppointment,
} from "../api/Appointments";
import { searchDoctorsByClinic } from "../api/Schedule";

const STATUS_META = {
  scheduled: { label: "Expected", badge: "scheduled" },
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

function isoDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function todayISO() {
  return isoDate(new Date());
}
function yesterdayISO() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return isoDate(d);
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

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function getDateLabel() {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function ReceptionDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const clinicId = user?.profile?.clinic?.[0]?.clinic_id || null;

  const [doctors, setDoctors] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(true);

  const [todayAppointments, setTodayAppointments] = useState([]);
  const [todayTotal, setTodayTotal] = useState(null); // accurate meta.total, may exceed the capped item list below
  const [yesterdayTotal, setYesterdayTotal] = useState(null);
  const [queueLoading, setQueueLoading] = useState(true);
  const [queueError, setQueueError] = useState("");

  const [actingId, setActingId] = useState(null);
  const [actionError, setActionError] = useState("");
  const [actionNotice, setActionNotice] = useState("");

  const [findQuery, setFindQuery] = useState("");

  useEffect(() => {
    if (!clinicId) return;
    setDoctorsLoading(true);
    searchDoctorsByClinic(clinicId)
      .then(setDoctors)
      .catch(() => setDoctors([]))
      .finally(() => setDoctorsLoading(false));
  }, [clinicId]);

  function loadToday() {
    setQueueLoading(true);
    setQueueError("");
    // per_page capped at 50 server-side — a clinic with more than 50
    // appointments in a single day would need real pagination here,
    // not handled by this overview page.
    getReceptionistAppointments({ date: todayISO(), per_page: 50 })
      .then((result) => {
        setTodayAppointments(result.items);
        setTodayTotal(result.meta.total);
      })
      .catch((err) =>
        setQueueError(err.message || "Couldn't load today's appointments."),
      )
      .finally(() => setQueueLoading(false));
  }

  useEffect(() => {
    loadToday();
    getReceptionistAppointments({ date: yesterdayISO(), per_page: 1 })
      .then((result) => setYesterdayTotal(result.meta.total))
      .catch(() => setYesterdayTotal(null));
  }, []);

  async function handleCheckIn(id) {
    setActingId(id);
    setActionError("");
    setActionNotice("");
    try {
      const updated = await checkInAppointment(id);
      setTodayAppointments((list) =>
        list.map((a) => (a.id === id ? updated : a)),
      );
      setActionNotice("Patient checked in.");
    } catch (err) {
      setActionError(err.message || "Couldn't check in patient.");
    } finally {
      setActingId(null);
    }
  }

  function handleFindPatient(e) {
    e.preventDefault();
    navigate(
      findQuery.trim()
        ? `/patients?q=${encodeURIComponent(findQuery.trim())}`
        : "/patients",
    );
  }

  const checkedInCount = todayAppointments.filter(
    (a) => a.status === "checked_in",
  ).length;
  const scheduledCount = todayAppointments.filter(
    (a) => a.status === "scheduled",
  ).length;
  const noShowCount = todayAppointments.filter(
    (a) => a.status === "no_show",
  ).length;

  const delta =
    todayTotal != null && yesterdayTotal != null
      ? todayTotal - yesterdayTotal
      : null;

  const STATS = [
    {
      label: "Total Appointments",
      num: todayTotal,
      sub:
        delta != null
          ? `${delta >= 0 ? "+" : ""}${delta} from yesterday`
          : null,
      icon: "ti-calendar-check",
    },
    {
      label: "Checked-in",
      num: checkedInCount,
      sub: null,
      icon: "ti-user-check",
    },
    { label: "Expected", num: scheduledCount, sub: null, icon: "ti-hourglass" },
    { label: "No-show", num: noShowCount, sub: null, icon: "ti-user-off" },
  ];

  const doctorCards = doctors.map((doc) => {
    const doctorAppts = todayAppointments.filter(
      (a) => a.doctor?.id === doc.id,
    );
    const waiting = doctorAppts.filter((a) => a.status === "checked_in").length;
    const busy = doctorAppts.some((a) => a.status === "in_progress");
    return {
      ...doc,
      specialty: doc.departments?.[0]?.name || "—",
      apptsCount: doctorAppts.length,
      waiting,
      busy,
    };
  });

  const queue = [...todayAppointments]
    .sort((a, b) => {
      const ta = a.slot?.starts_at ? new Date(a.slot.starts_at).getTime() : 0;
      const tb = b.slot?.starts_at ? new Date(b.slot.starts_at).getTime() : 0;
      return ta - tb;
    })
    .slice(0, 10);

  return (
    <div className="layout-shell">
      <Sidebar />

      <div className="layout-main">
        <Topbar searchPlaceholder="Search patients..." />

        <main className="page-content">
          <div className="page-header">
            <div className="page-header-left">
              <h1>
                {getGreeting()}
                {user?.full_name ? `, ${user.full_name.split(" ")[0]}` : ""}.
              </h1>
              <p>Here is the overview for today's clinic operations.</p>
            </div>
            <div className="date-badge">
              <i className="ti ti-calendar" aria-hidden="true" />
              {getDateLabel()}
            </div>
          </div>

          {!clinicId && (
            <div className="apt-banner apt-banner-error">
              Your account isn't linked to a clinic yet.
            </div>
          )}
          {queueError && (
            <div className="apt-banner apt-banner-error">{queueError}</div>
          )}
          {actionNotice && (
            <div className="apt-banner apt-banner-success">{actionNotice}</div>
          )}
          {actionError && (
            <div className="apt-banner apt-banner-error">{actionError}</div>
          )}

          <div className="reception-stats">
            {STATS.map(({ label, num, sub, icon }) => (
              <div className="reception-stat-card" key={label}>
                <div className="reception-stat-left">
                  <div className="reception-stat-label">{label}</div>
                  <div className="reception-stat-num">
                    {queueLoading || num == null ? "—" : num}
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

          <div className="reception-layout">
            <div>
              <div className="section-header">
                <h2 className="section-title">On Duty Today</h2>
              </div>

              <div className="doctor-cards">
                {doctorsLoading && (
                  <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
                    Loading…
                  </p>
                )}
                {!doctorsLoading && doctorCards.length === 0 && (
                  <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
                    No verified doctors with an active schedule found at your
                    clinic yet.
                  </p>
                )}
                {doctorCards.map((doc) => (
                  <div className="doctor-card" key={doc.id}>
                    <div className="doctor-card-avatar">
                      {initialsOf(doc.name)}
                      <div
                        className={`doctor-online-dot ${doc.busy ? "busy" : "available"}`}
                      />
                    </div>
                    <div className="doctor-card-body">
                      <div className="doctor-card-top">
                        <span className="doctor-card-name">{doc.name}</span>
                        <span
                          className={`avail-badge ${doc.busy ? "busy" : "available"}`}
                        >
                          {doc.busy ? "BUSY" : "AVAILABLE"}
                        </span>
                      </div>
                      <div className="doctor-card-specialty">
                        {doc.specialty}
                      </div>
                      <div className="doctor-card-stats">
                        <div className="doctor-stat">
                          <span className="doctor-stat-num">
                            {doc.apptsCount}
                          </span>
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

              <div className="queue-card">
                <div className="queue-card-header">
                  <span className="queue-card-title">Upcoming Queue</span>
                  <div className="queue-card-icons">
                    <button
                      className="icon-btn"
                      aria-label="Refresh"
                      onClick={loadToday}
                    >
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
                    {queueLoading && (
                      <tr>
                        <td
                          colSpan={5}
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
                    {!queueLoading && queue.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          style={{
                            textAlign: "center",
                            padding: 24,
                            color: "var(--text-muted)",
                          }}
                        >
                          No appointments today.
                        </td>
                      </tr>
                    )}
                    {queue.map((row) => {
                      const meta = STATUS_META[row.status] || {
                        label: row.status,
                        badge: row.status,
                      };
                      return (
                        <tr key={row.id}>
                          <td style={{ fontSize: 14, fontWeight: 500 }}>
                            {formatTime(row.slot)}
                          </td>
                          <td>
                            <div className="patient-cell">
                              <div className="patient-avatar">
                                {initialsOf(row.patient?.name)}
                              </div>
                              <div>
                                <div className="patient-name">
                                  {row.patient?.name || "—"}
                                </div>
                                <div className="patient-id">
                                  ID: {row.patient?.id ?? "—"}
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
                            {row.doctor?.name || "—"}
                          </td>
                          <td>
                            <span className={`badge badge-${meta.badge}`}>
                              {meta.label}
                            </span>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            {row.status === "scheduled" ? (
                              <button
                                className="btn-dark"
                                disabled={actingId === row.id}
                                onClick={() => handleCheckIn(row.id)}
                              >
                                {actingId === row.id
                                  ? "Checking in…"
                                  : "Check-in"}
                              </button>
                            ) : (
                              <button
                                className="icon-btn"
                                aria-label="View in Appointments"
                                onClick={() => navigate("/appointments")}
                              >
                                <i
                                  className="ti ti-dots-vertical"
                                  aria-hidden="true"
                                />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <div className="queue-card-footer">
                  <button
                    className="queue-view-all"
                    onClick={() => navigate("/appointments")}
                  >
                    View All {todayTotal ?? ""} Appointments
                  </button>
                </div>
              </div>
            </div>

            <div className="quick-actions-card">
              <div className="quick-actions-header">Quick Actions</div>
              <div className="quick-actions-body">
                <button
                  className="quick-action-btn dark"
                  onClick={() =>
                    navigate("/appointments", {
                      state: { initialStatus: "scheduled" },
                    })
                  }
                >
                  <i className="ti ti-user-check" aria-hidden="true" />
                  Patient Check-In
                </button>
                <button
                  className="quick-action-btn outline"
                  onClick={() =>
                    navigate("/appointments", { state: { openBooking: true } })
                  }
                >
                  <i className="ti ti-calendar-plus" aria-hidden="true" />
                  New Appointment
                </button>
                <button
                  className="quick-action-btn outline"
                  onClick={() =>
                    navigate("/appointments", {
                      state: { initialStatus: "scheduled" },
                    })
                  }
                >
                  <i className="ti ti-user-off" aria-hidden="true" />
                  Mark No-Show
                </button>

                <div className="quick-actions-divider" />

                <form onSubmit={handleFindPatient}>
                  <div className="find-patient-label">Find Patient</div>
                  <div className="find-patient-input">
                    <i className="ti ti-search" aria-hidden="true" />
                    <input
                      type="text"
                      placeholder="Name, ID, or Phone..."
                      value={findQuery}
                      onChange={(e) => setFindQuery(e.target.value)}
                    />
                  </div>
                </form>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
