import { useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import "./styles/Layout.css";
import "./styles/Appointments.css";

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

const FILTER_TABS = [
  "All",
  "Scheduled",
  "Checked-in",
  "Waiting",
  "In progress",
  "Completed",
  "Cancelled",
  "No-show",
];

const APPOINTMENTS = [
  {
    id: 1,
    patientName: "James Wilson",
    patientId: "P-9284",
    phone: "(555) 123-4567",
    initials: "JW",
    doctor: "Dr. Sarah Jenkins",
    date: "Oct 24, 2023",
    time: "09:00 AM",
    type: "Annual Physical",
    status: "scheduled",
    statusLabel: "Scheduled",
  },
  {
    id: 2,
    patientName: "Maria Rodriguez",
    patientId: "P-8372",
    phone: "(555) 987-6543",
    initials: "MR",
    doctor: "Dr. Michael Chen",
    date: "Oct 24, 2023",
    time: "09:30 AM",
    type: "Follow-up",
    status: "checked-in",
    statusLabel: "Checked-in",
  },
  {
    id: 3,
    patientName: "Emily Davis",
    patientId: "P-1029",
    phone: "(555) 321-7654",
    initials: "ED",
    doctor: "Dr. Sarah Jenkins",
    date: "Oct 24, 2023",
    time: "08:00 AM",
    type: "Consultation",
    status: "completed",
    statusLabel: "Completed",
  },
  {
    id: 4,
    patientName: "John Doe",
    patientId: "P-7741",
    phone: "(555) 444-5566",
    initials: "JD",
    doctor: "Dr. Ahmad",
    date: "Oct 24, 2023",
    time: "10:00 AM",
    type: "Lab Review",
    status: "waiting",
    statusLabel: "Waiting",
  },
  {
    id: 5,
    patientName: "Sarah Miller",
    patientId: "P-5530",
    phone: "(555) 789-0011",
    initials: "SM",
    doctor: "Dr. Ahmad",
    date: "Oct 24, 2023",
    time: "10:30 AM",
    type: "Follow-up",
    status: "scheduled",
    statusLabel: "Scheduled",
  },
  {
    id: 6,
    patientName: "Robert Johnson",
    patientId: "P-3310",
    phone: "(555) 222-3344",
    initials: "RJ",
    doctor: "Dr. Michael Chen",
    date: "Oct 24, 2023",
    time: "11:00 AM",
    type: "Annual Physical",
    status: "no-show",
    statusLabel: "No-show",
  },
  {
    id: 7,
    patientName: "Priya Nair",
    patientId: "P-6621",
    phone: "(555) 112-2334",
    initials: "PN",
    doctor: "Dr. Ahmad",
    date: "Oct 24, 2023",
    time: "11:30 AM",
    type: "Consultation",
    status: "in-progress",
    statusLabel: "In progress",
  },
];

const SEARCH_PATIENTS = [
  {
    name: "John Smith",
    id: "P-98765",
    phone: "(555) 123-4567",
    initials: "JS",
  },
  {
    name: "James Wilson",
    id: "P-9284",
    phone: "(555) 123-4567",
    initials: "JW",
  },
  { name: "Janet Dell", id: "P-8823", phone: "(555) 555-5555", initials: "JD" },
];

const TIME_SLOTS = [
  { time: "09:00 AM", taken: false },
  { time: "09:30 AM", taken: false },
  { time: "10:00 AM", taken: true },
  { time: "10:30 AM", taken: false },
  { time: "11:00 AM", taken: false },
  { time: "11:30 AM", taken: false },
];

/* ── Action button per row ─────────────────────────────── */
function ActionBtn({ status }) {
  if (status === "scheduled")
    return <button className="btn-dark">Check-in</button>;
  if (status === "checked-in")
    return <button className="btn-outline">Begin</button>;
  if (status === "waiting") return <button className="btn-dark">Begin</button>;
  if (status === "in-progress")
    return <button className="btn-dark">Open Workflow</button>;
  if (status === "completed")
    return (
      <button className="btn-ghost">
        <i className="ti ti-eye" />
      </button>
    );
  return null;
}

/* ── New Appointment Modal ─────────────────────────────── */
function NewAppointmentModal({ onClose }) {
  const [tab, setTab] = useState("existing");
  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(SEARCH_PATIENTS[0]);
  const [selectedTime, setSelectedTime] = useState("10:30 AM");

  const filtered = SEARCH_PATIENTS.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal">
        {/* Header */}
        <div className="modal-header">
          <div>
            <h2>New Appointment</h2>
            <p>Schedule a visit for an existing or new patient.</p>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <i className="ti ti-x" aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Left — patient selection */}
          <div className="modal-left">
            <div className="modal-toggle">
              <button
                className={`modal-toggle-btn${tab === "existing" ? " active" : ""}`}
                onClick={() => setTab("existing")}
              >
                Existing Patient
              </button>
              <button
                className={`modal-toggle-btn${tab === "new" ? " active" : ""}`}
                onClick={() => setTab("new")}
              >
                New Patient
              </button>
            </div>

            {tab === "existing" ? (
              <>
                <div className="modal-search">
                  <i className="ti ti-search" aria-hidden="true" />
                  <input
                    type="text"
                    placeholder="Search by Name, ID, or Phone..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  {filtered.map((p) => (
                    <div
                      key={p.id}
                      className={`patient-result${selectedPatient?.id === p.id ? " selected" : ""}`}
                      onClick={() => setSelectedPatient(p)}
                    >
                      <div className="patient-cell">
                        <div className="patient-avatar">{p.initials}</div>
                        <div>
                          <div className="patient-name">{p.name}</div>
                          <div className="patient-id">
                            ID: {p.id} • {p.phone}
                          </div>
                        </div>
                      </div>
                      {selectedPatient?.id === p.id && (
                        <i
                          className="ti ti-circle-check"
                          style={{ color: "var(--green)", fontSize: 20 }}
                          aria-hidden="true"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <div className="modal-field">
                  <label className="modal-label">First Name</label>
                  <input
                    className="modal-input"
                    type="text"
                    placeholder="John"
                  />
                </div>
                <div className="modal-field">
                  <label className="modal-label">Last Name</label>
                  <input
                    className="modal-input"
                    type="text"
                    placeholder="Smith"
                  />
                </div>
                <div className="modal-field">
                  <label className="modal-label">Phone</label>
                  <input
                    className="modal-input"
                    type="tel"
                    placeholder="(555) 000-0000"
                  />
                </div>
                <div className="modal-field">
                  <label className="modal-label">Date of Birth</label>
                  <input className="modal-input" type="date" />
                </div>
              </div>
            )}
          </div>

          {/* Right — clinic, doctor, date, time */}
          <div className="modal-right">
            <div className="modal-field">
              <label className="modal-label">Clinic &amp; Doctor</label>
              <select className="modal-select" style={{ marginBottom: 10 }}>
                <option>St. Jude Medical — City Central</option>
                <option>St. Jude Medical — North Branch</option>
              </select>
              <select className="modal-select">
                <option>Select Doctor (Optional)</option>
                <option>Dr. Ahmad</option>
                <option>Dr. Sarah Jenkins</option>
                <option>Dr. Michael Chen</option>
              </select>
            </div>

            <div className="modal-field">
              <label className="modal-label">Appointment Type</label>
              <select className="modal-select">
                <option>Annual Physical</option>
                <option>Follow-up</option>
                <option>Consultation</option>
                <option>Lab Review</option>
              </select>
            </div>

            <div className="modal-field">
              <label className="modal-label">Date</label>
              <input
                className="modal-input"
                type="date"
                defaultValue="2023-10-25"
              />
            </div>

            <div className="modal-field">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 6,
                }}
              >
                <span className="modal-label" style={{ margin: 0 }}>
                  Available Times
                </span>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  Oct 25, 2023
                </span>
              </div>
              <div className="time-slots">
                {TIME_SLOTS.map(({ time, taken }) => (
                  <button
                    key={time}
                    className={`time-slot${taken ? " taken" : selectedTime === time ? " selected" : ""}`}
                    onClick={() => !taken && setSelectedTime(time)}
                    disabled={taken}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-dark">Confirm Booking</button>
        </div>
      </div>
    </div>
  );
}

/* ── Main page ─────────────────────────────────────────── */
export default function AppointmentsPage() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [doctor, setDoctor] = useState("All Doctors");

  const filtered =
    activeFilter === "All"
      ? APPOINTMENTS
      : APPOINTMENTS.filter(
          (a) => a.statusLabel.toLowerCase() === activeFilter.toLowerCase(),
        );

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
          <div className="page-toolbar">
            <div>
              <h1
                style={{
                  fontFamily: "'DM Serif Display', serif",
                  fontSize: 26,
                  fontWeight: 400,
                  margin: "0 0 4px",
                  color: "var(--text-primary)",
                }}
              >
                Appointment Management
              </h1>
            </div>
            <div className="page-toolbar-right">
              <select
                className="toolbar-select"
                value={doctor}
                onChange={(e) => setDoctor(e.target.value)}
              >
                <option>All Doctors</option>
                <option>Dr. Ahmad</option>
                <option>Dr. Sarah Jenkins</option>
                <option>Dr. Michael Chen</option>
              </select>
              <button className="btn-dark" onClick={() => setShowModal(true)}>
                <i className="ti ti-plus" aria-hidden="true" />
                New Appointment
              </button>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="filter-tabs">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab}
                className={`filter-tab${activeFilter === tab ? " active" : ""}`}
                onClick={() => setActiveFilter(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Date &amp; Time</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((apt) => (
                  <tr key={apt.id}>
                    <td>
                      <div className="patient-cell">
                        <div className="patient-avatar">{apt.initials}</div>
                        <div>
                          <div className="patient-name">{apt.patientName}</div>
                          <div className="patient-id">{apt.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td
                      style={{ color: "var(--text-secondary)", fontSize: 14 }}
                    >
                      {apt.doctor}
                    </td>
                    <td>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>
                        {apt.time}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        {apt.date}
                      </div>
                    </td>
                    <td
                      style={{ fontSize: 14, color: "var(--text-secondary)" }}
                    >
                      {apt.type}
                    </td>
                    <td>
                      <span className={`badge badge-${apt.status}`}>
                        {apt.statusLabel}
                      </span>
                    </td>
                    <td>
                      <div className="action-cell">
                        <ActionBtn status={apt.status} />
                        <button className="icon-btn" aria-label="More options">
                          <i
                            className="ti ti-dots-vertical"
                            aria-hidden="true"
                          />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Footer */}
            <div className="table-footer">
              <span>
                Showing 1 to {filtered.length} of {filtered.length} entries
              </span>
              <div className="pagination">
                <button className="page-btn">
                  <i className="ti ti-chevron-left" />
                </button>
                <button className="page-btn active">1</button>
                <button className="page-btn">2</button>
                <button className="page-btn">3</button>
                <button className="page-btn">
                  <i className="ti ti-chevron-right" />
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Modal */}
      {showModal && <NewAppointmentModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
