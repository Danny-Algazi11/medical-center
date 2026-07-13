import { useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import "./styles/Layout.css";
import "./styles/Patients.css";

/* ── Mock data ─────────────────────────────────────────── */
const CURRENT_USER = {
  name: "Dr. Sterling",
  role: "Chief Surgeon",
  initials: "DS",
};

const TABS = [
  { to: "/dashboard", label: "Doctor Portal" },
  { to: "/reception", label: "Reception" },
  { to: "/analytics", label: "Analytics" },
];

const PATIENTS = [
  {
    id: "MP-8821",
    name: "Eleanor Shellstrop",
    initials: "ES",
    phone: "+1 (555) 012-3456",
    gender: "Female",
    age: 34,
    lastVisit: "Oct 24, 2023",
    doctor: "Dr. Chidi Anagonye",
    status: "active",
    statusLabel: "Active",
    joined: "2021",
    bloodType: "A+",
    weight: "62kg",
    height: "168cm",
    allergies: "Penicillin, Peanuts",
    conditions: "Mild Asthma, Hypertension (Controlled)",
    history: [
      {
        type: "normal",
        icon: "ti-file-text",
        title: "Annual Physical Exam",
        meta: "Oct 24, 2023 • Dr. Chidi Anagonye",
        desc: "Normal cardiovascular findings. Slight elevation in blood pressure compared to previous baseline.",
      },
      {
        type: "emergency",
        icon: "ti-asterisk",
        title: "Emergency Room Visit",
        meta: "May 14, 2023 • St. Jude Hospital",
        desc: "Acute asthma exacerbation treated with nebulizer. Discharged same day.",
      },
    ],
  },
  {
    id: "MP-8822",
    name: "Jason Mendoza",
    initials: "JM",
    phone: "+1 (555) 098-7654",
    gender: "Male",
    age: 28,
    lastVisit: "Nov 02, 2023",
    doctor: "Dr. Tahani Al-Jamil",
    status: "active",
    statusLabel: "New",
    joined: "2023",
    bloodType: "O+",
    weight: "85kg",
    height: "182cm",
    allergies: "None known",
    conditions: "None",
    history: [
      {
        type: "normal",
        icon: "ti-file-text",
        title: "Initial Consultation",
        meta: "Nov 02, 2023 • Dr. Tahani Al-Jamil",
        desc: "New patient intake. Comprehensive health screening completed. All vitals within normal range.",
      },
    ],
  },
  {
    id: "MP-8823",
    name: "Janet Dell",
    initials: "JD",
    phone: "+1 (555) 555-5555",
    gender: "Female",
    age: 62,
    lastVisit: "Oct 12, 2023",
    doctor: "Dr. Sterling",
    status: "follow-up",
    statusLabel: "Follow-up",
    joined: "2018",
    bloodType: "B-",
    weight: "71kg",
    height: "160cm",
    allergies: "Sulfa drugs",
    conditions: "Type 2 Diabetes, Osteoarthritis",
    history: [
      {
        type: "normal",
        icon: "ti-file-text",
        title: "Diabetes Management Review",
        meta: "Oct 12, 2023 • Dr. Sterling",
        desc: "HbA1c levels slightly elevated. Medication adjusted. Follow-up in 6 weeks.",
      },
      {
        type: "normal",
        icon: "ti-file-text",
        title: "Orthopedic Consultation",
        meta: "Aug 03, 2023 • Dr. Sterling",
        desc: "Knee osteoarthritis progression noted. Physical therapy recommended.",
      },
    ],
  },
  {
    id: "MP-8824",
    name: "Tahani Bennett",
    initials: "TB",
    phone: "+1 (555) 444-1111",
    gender: "Female",
    age: 29,
    lastVisit: "Nov 08, 2023",
    doctor: "Dr. Chidi Anagonye",
    status: "active",
    statusLabel: "Active",
    joined: "2022",
    bloodType: "AB+",
    weight: "58kg",
    height: "172cm",
    allergies: "Latex",
    conditions: "None",
    history: [
      {
        type: "normal",
        icon: "ti-file-text",
        title: "Annual Checkup",
        meta: "Nov 08, 2023 • Dr. Chidi Anagonye",
        desc: "Routine annual physical. All results within normal range. Vaccinations up to date.",
      },
    ],
  },
  {
    id: "MP-8825",
    name: "Michael Scott",
    initials: "MS",
    phone: "+1 (555) 867-5309",
    gender: "Male",
    age: 47,
    lastVisit: "Sep 19, 2023",
    doctor: "Dr. Tahani Al-Jamil",
    status: "active",
    statusLabel: "Active",
    joined: "2019",
    bloodType: "A-",
    weight: "91kg",
    height: "178cm",
    allergies: "Aspirin",
    conditions: "Hypertension, High Cholesterol",
    history: [
      {
        type: "normal",
        icon: "ti-file-text",
        title: "Cardiology Follow-up",
        meta: "Sep 19, 2023 • Dr. Tahani Al-Jamil",
        desc: "Blood pressure better controlled. Statin dosage maintained. Dietary counseling provided.",
      },
      {
        type: "emergency",
        icon: "ti-asterisk",
        title: "Emergency — Chest Pain",
        meta: "Jan 07, 2023 • St. Jude Hospital",
        desc: "Admitted for chest pain evaluation. Cardiac enzymes normal. Discharged after 48h observation.",
      },
    ],
  },
];

/* ── Status badge map ──────────────────────────────────── */
function statusClass(s) {
  if (s === "active") return "badge-active";
  if (s === "follow-up") return "badge-waiting";
  return "badge-scheduled";
}

/* ── Patient overview panel ────────────────────────────── */
function PatientPanel({ patient, onClose }) {
  return (
    <aside className="patient-panel">
      {/* Header */}
      <div className="panel-header">
        <h3>Patient Overview</h3>
        <button
          className="panel-close"
          onClick={onClose}
          aria-label="Close panel"
        >
          <i className="ti ti-x" aria-hidden="true" />
        </button>
      </div>

      {/* Avatar */}
      <div className="panel-avatar-section">
        <div className="panel-avatar">
          {patient.initials}
          <div className="panel-online-dot" />
        </div>
        <h2 className="panel-patient-name">{patient.name}</h2>
        <p className="panel-patient-meta">
          #{patient.id} • Joined {patient.joined}
        </p>
      </div>

      {/* Vitals */}
      <div className="panel-vitals">
        <div className="panel-vital">
          <div className="panel-vital-label">Blood Type</div>
          <div className="panel-vital-value">{patient.bloodType}</div>
        </div>
        <div className="panel-vital">
          <div className="panel-vital-label">Weight</div>
          <div className="panel-vital-value">{patient.weight}</div>
        </div>
        <div className="panel-vital">
          <div className="panel-vital-label">Height</div>
          <div className="panel-vital-value">{patient.height}</div>
        </div>
      </div>

      {/* Allergies */}
      <div className="panel-section">
        <div className="panel-section-row">
          <div className="panel-section-icon red">
            <i className="ti ti-alert-triangle" aria-hidden="true" />
          </div>
          <div>
            <div className="panel-section-label">Allergies</div>
            <div className="panel-section-value">{patient.allergies}</div>
          </div>
        </div>
      </div>

      {/* Chronic Conditions */}
      <div className="panel-section">
        <div className="panel-section-row">
          <div className="panel-section-icon amber">
            <i className="ti ti-heart-rate-monitor" aria-hidden="true" />
          </div>
          <div>
            <div className="panel-section-label">Chronic Conditions</div>
            <div className="panel-section-value">{patient.conditions}</div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="panel-actions">
        <div className="panel-actions-row">
          <button className="btn-full dark">
            <i className="ti ti-calendar-plus" aria-hidden="true" />
            Book Appointment
          </button>
          <button className="btn-full outline">
            <i className="ti ti-message-circle" aria-hidden="true" />
            Message
          </button>
        </div>
        <button className="btn-full outline">
          <i className="ti ti-file-medical" aria-hidden="true" />
          View Full Medical Records
        </button>
        <button className="btn-full dashed">
          <i className="ti ti-player-play" aria-hidden="true" />
          Open New Workflow
        </button>
      </div>

      {/* Visit history */}
      <div className="panel-history">
        {patient.history.map((h, i) => (
          <div className="history-card" key={i}>
            <div
              className={`history-icon${h.type === "emergency" ? " emergency" : ""}`}
            >
              <i className={`ti ${h.icon}`} aria-hidden="true" />
            </div>
            <div>
              <div className="history-title">{h.title}</div>
              <div className="history-meta">{h.meta}</div>
              <div className="history-desc">{h.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

/* ── Main page ─────────────────────────────────────────── */
export default function PatientsPage() {
  const [selected, setSelected] = useState(PATIENTS[0]);
  const [search, setSearch] = useState("");

  const filtered = PATIENTS.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase()),
  );

  function selectPatient(p) {
    setSelected((prev) => (prev?.id === p.id ? null : p));
  }

  return (
    <div className="layout-shell">
      <Sidebar user={CURRENT_USER} />

      <div className="layout-main">
        <Topbar
          user={CURRENT_USER}
          tabs={TABS}
          searchPlaceholder="Search patients by name or ID..."
        />

        <main className="page-content">
          {/* Toolbar */}
          <div className="patients-toolbar">
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
                Patient Directory
              </h1>
              <p
                style={{
                  fontSize: 14,
                  color: "var(--text-secondary)",
                  margin: 0,
                  fontWeight: 300,
                }}
              >
                Manage and monitor all clinic patients from a single dashboard.
              </p>
            </div>
            <div className="patients-toolbar-right">
              <button className="btn-outline">
                <i className="ti ti-filter" aria-hidden="true" />
                Filter
              </button>
              <button className="btn-dark">
                <i className="ti ti-plus" aria-hidden="true" />
                Add Patient
              </button>
            </div>
          </div>

          {/* Content — table + panel */}
          <div className={`patients-layout${selected ? " panel-open" : ""}`}>
            {/* Table */}
            <div className="card">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Contact</th>
                    <th>Gender / Age</th>
                    <th>Last Visit</th>
                    <th>Assigned Doctor</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr
                      key={p.id}
                      className={selected?.id === p.id ? "row-selected" : ""}
                      onClick={() => selectPatient(p)}
                    >
                      <td>
                        <div className="patient-cell">
                          <div className="patient-avatar">{p.initials}</div>
                          <div>
                            <div className="patient-name">{p.name}</div>
                            <div className="patient-id">ID: #{p.id}</div>
                          </div>
                        </div>
                      </td>
                      <td
                        style={{ fontSize: 13, color: "var(--text-secondary)" }}
                      >
                        {p.phone}
                      </td>
                      <td
                        style={{ fontSize: 13, color: "var(--text-secondary)" }}
                      >
                        {p.gender}, {p.age}
                      </td>
                      <td
                        style={{ fontSize: 13, color: "var(--text-secondary)" }}
                      >
                        {p.lastVisit}
                      </td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            fontSize: 13,
                            color: "var(--text-secondary)",
                          }}
                        >
                          <i
                            className="ti ti-calendar-event"
                            style={{ fontSize: 14, color: "var(--text-muted)" }}
                            aria-hidden="true"
                          />
                          {p.doctor}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${statusClass(p.status)}`}>
                          {p.statusLabel}
                        </span>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <button className="icon-btn" aria-label="More options">
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

              {/* Table footer */}
              <div className="table-footer">
                <span>Showing 1 to {filtered.length} of 124 patients</span>
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

            {/* Patient panel */}
            {selected && (
              <PatientPanel
                patient={selected}
                onClose={() => setSelected(null)}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
