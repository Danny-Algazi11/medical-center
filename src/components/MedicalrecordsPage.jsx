import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import "./styles/Layout.css";
import "./styles/MedicalRecords.css";

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

const QUEUE = [
  {
    id: 1,
    name: "Elena Rodriguez",
    initials: "ER",
    time: "10:00 AM • Follow-up",
    wait: "Waiting: 12m",
    status: "active",
    statusLabel: "ACTIVE",
    age: 42,
    gender: "Female",
    mrn: "MRN-48291",
    blood: "B+",
    conditions: ["Type 2 Diabetes", "Hypertension"],
    allergies: [
      { label: "CRITICAL ALLERGY", type: "critical" },
      { label: "Penicillin Allergy", type: "normal" },
    ],
    conditionTags: ["Type 2 Diabetes", "Hypertension"],
    prescriptions: [
      {
        name: "Metformin HCL 500mg",
        dosage: "500mg",
        frequency: "BID with meals",
        duration: "90 Days",
      },
      {
        name: "Lisinopril 10mg",
        dosage: "10mg",
        frequency: "Once daily",
        duration: "30 Days",
      },
    ],
    record: {
      conditions: ["Type 2 Diabetes", "Hypertension"],
      allergies: ["Penicillin (Hives)"],
      surgeries: [{ name: "Appendectomy", year: "2015" }],
      family: [{ name: "Heart Disease", relation: "Father" }],
    },
  },
  {
    id: 2,
    name: "Marcus Thorne",
    initials: "MT",
    time: "10:30 AM • Hypertension",
    wait: "Waiting: 5m",
    status: "waiting",
    statusLabel: "WAITING",
    age: 55,
    gender: "Male",
    mrn: "MRN-33120",
    blood: "A+",
    conditions: ["Hypertension"],
    allergies: [],
    conditionTags: ["Hypertension"],
    prescriptions: [
      {
        name: "Amlodipine 5mg",
        dosage: "5mg",
        frequency: "Once daily",
        duration: "60 Days",
      },
    ],
    record: {
      conditions: ["Hypertension"],
      allergies: ["None known"],
      surgeries: [],
      family: [{ name: "Stroke", relation: "Mother" }],
    },
  },
];

const RECORD_TABS = [
  "Medical History",
  "Medications",
  "Attachments",
  "Last Encounter",
];

/* ── Main page ─────────────────────────────────────────── */
export default function MedicalRecordsPage() {
  const [queueTab, setQueueTab] = useState("Checked-in");
  const [activeId, setActiveId] = useState(1);
  const [recordTab, setRecordTab] = useState("Medical History");
  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");

  const patient = QUEUE.find((q) => q.id === activeId) || QUEUE[0];

  return (
    <div className="layout-shell">
      <Sidebar user={CURRENT_USER} />

      <div className="layout-main">
        <Topbar
          user={CURRENT_USER}
          tabs={TABS}
          searchPlaceholder="Search patients..."
        />

        <div className="medrecords-layout">
          {/* ── Queue panel ── */}
          <div className="queue-panel">
            <div className="queue-toggle">
              {["Checked-in", "Completed"].map((t) => (
                <button
                  key={t}
                  className={`queue-toggle-btn${queueTab === t ? " active" : ""}`}
                  onClick={() => setQueueTab(t)}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="queue-list">
              {QUEUE.map((q) => (
                <div
                  key={q.id}
                  className={`queue-item${activeId === q.id ? " active" : ""}`}
                  onClick={() => setActiveId(q.id)}
                >
                  <div className="queue-item-top">
                    <span className="queue-item-name">{q.name}</span>
                    <span className={`queue-status-dot ${q.status}`}>
                      {q.statusLabel}
                    </span>
                  </div>
                  <div className="queue-item-sub">{q.time}</div>
                  <div className="queue-item-wait">
                    <i className="ti ti-clock" aria-hidden="true" />
                    {q.wait}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Workspace ── */}
          <div className="workspace-panel">
            {/* Patient banner */}
            <div className="patient-banner">
              <div className="banner-avatar">{patient.initials}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <h2 className="banner-name">{patient.name}</h2>
                  {patient.allergies.map((a) => (
                    <span key={a.label} className={`allergy-tag ${a.type}`}>
                      {a.label}
                    </span>
                  ))}
                </div>
                <div className="banner-meta">
                  <span>{patient.age}Y</span>
                  <span className="banner-sep">•</span>
                  <span>{patient.gender}</span>
                  <span className="banner-sep">•</span>
                  <span>{patient.mrn}</span>
                  <span className="banner-sep">•</span>
                  <span
                    style={{ display: "flex", alignItems: "center", gap: 4 }}
                  >
                    <i
                      className="ti ti-droplet"
                      style={{ fontSize: 13, color: "var(--red)" }}
                      aria-hidden="true"
                    />
                    {patient.blood}
                  </span>
                </div>
              </div>
              <div className="banner-tags">
                {patient.conditionTags.map((c) => (
                  <span key={c} className="condition-tag">
                    {c}
                  </span>
                ))}
              </div>
            </div>

            {/* Scrollable workspace */}
            <div className="workspace-scroll">
              {/* Clinical Diagnosis */}
              <div className="ws-card">
                <div className="ws-card-header">
                  <div className="ws-card-title">
                    <i className="ti ti-stethoscope" aria-hidden="true" />
                    Clinical Diagnosis
                  </div>
                  <span className="ws-card-badge">ICD-10 INTEGRATED</span>
                </div>
                <textarea
                  className="diagnosis-area"
                  placeholder="Start typing diagnosis or clinical impression..."
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                />
                <div className="diagnosis-footer">
                  <button className="ws-icon-btn" aria-label="Voice input">
                    <i className="ti ti-microphone" aria-hidden="true" />
                  </button>
                  <button className="ws-icon-btn" aria-label="AI assist">
                    <i className="ti ti-sparkles" aria-hidden="true" />
                  </button>
                </div>
              </div>

              {/* Prescription Plan */}
              <div className="ws-card">
                <div className="ws-card-header">
                  <div className="ws-card-title">
                    <i className="ti ti-pill" aria-hidden="true" />
                    Prescription Plan
                  </div>
                  <button
                    className="btn-dark"
                    style={{ padding: "7px 14px", fontSize: 13 }}
                  >
                    <i className="ti ti-plus" aria-hidden="true" />
                    Add Medication
                  </button>
                </div>
                <table className="rx-table">
                  <thead>
                    <tr>
                      <th>Medicine Name</th>
                      <th>Dosage</th>
                      <th>Frequency</th>
                      <th>Duration</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {patient.prescriptions.map((rx, i) => (
                      <tr key={i}>
                        <td>
                          <span className="rx-name">{rx.name}</span>
                        </td>
                        <td style={{ color: "var(--text-secondary)" }}>
                          {rx.dosage}
                        </td>
                        <td style={{ color: "var(--text-secondary)" }}>
                          {rx.frequency}
                        </td>
                        <td style={{ color: "var(--text-secondary)" }}>
                          {rx.duration}
                        </td>
                        <td>
                          <button className="ws-icon-btn" aria-label="Remove">
                            <i className="ti ti-trash" aria-hidden="true" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Clinical Notes */}
              <div className="ws-card">
                <div className="ws-card-header">
                  <div className="ws-card-title">
                    <i className="ti ti-notes" aria-hidden="true" />
                    Clinical Consultation Notes
                  </div>
                </div>
                <textarea
                  className="notes-area"
                  placeholder="Detailed notes regarding the consultation, patient observations, and future care plan..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            {/* Footer actions */}
            <div className="workspace-footer">
              <button className="btn-ghost">Discard Encounter</button>
              <button className="btn-outline">
                <i className="ti ti-device-floppy" aria-hidden="true" />
                Save Draft
              </button>
              <button className="btn-outline">
                <i className="ti ti-file-invoice" aria-hidden="true" />
                Generate Rx
              </button>
              <button className="btn-dark">
                <i className="ti ti-circle-check" aria-hidden="true" />
                Complete Encounter
              </button>
            </div>
          </div>

          {/* ── Record sidebar ── */}
          <div className="record-panel">
            <div className="record-panel-header">
              <span className="record-panel-title">Medical Record</span>
              <button className="ws-icon-btn" aria-label="More options">
                <i className="ti ti-dots" aria-hidden="true" />
              </button>
            </div>

            <div className="record-tabs">
              {RECORD_TABS.map((t) => (
                <button
                  key={t}
                  className={`record-tab${recordTab === t ? " active" : ""}`}
                  onClick={() => setRecordTab(t)}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="record-scroll">
              {recordTab === "Medical History" && (
                <>
                  {/* Chronic Conditions */}
                  <div className="record-section">
                    <div className="record-section-header">
                      <i
                        className="ti ti-heart-rate-monitor teal"
                        aria-hidden="true"
                      />
                      Chronic Conditions
                    </div>
                    <div className="record-section-body">
                      {patient.record.conditions.map((c) => (
                        <div key={c} className="record-item">
                          {c}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Allergies */}
                  <div className="record-section">
                    <div className="record-section-header">
                      <i
                        className="ti ti-alert-triangle red"
                        aria-hidden="true"
                      />
                      Allergies
                    </div>
                    <div className="record-section-body">
                      {patient.record.allergies.map((a) => (
                        <div key={a} className="record-item allergy">
                          {a}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Surgeries */}
                  <div className="record-section">
                    <div className="record-section-header">
                      <i
                        className="ti ti-surgical-staple green"
                        aria-hidden="true"
                      />
                      Surgeries
                    </div>
                    <div className="record-section-body">
                      {patient.record.surgeries.length === 0 ? (
                        <div
                          style={{ fontSize: 13, color: "var(--text-muted)" }}
                        >
                          None recorded
                        </div>
                      ) : (
                        patient.record.surgeries.map((s) => (
                          <div key={s.name} className="record-row">
                            <div className="record-item">{s.name}</div>
                            <div className="record-year">{s.year}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Family History */}
                  <div className="record-section">
                    <div className="record-section-header">
                      <i className="ti ti-users amber" aria-hidden="true" />
                      Family History
                    </div>
                    <div className="record-section-body">
                      {patient.record.family.map((f) => (
                        <div key={f.name} className="record-row">
                          <div className="record-item">{f.name}</div>
                          <div className="record-year">{f.relation}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {recordTab === "Medications" && (
                <div className="record-section">
                  <div className="record-section-header">
                    <i className="ti ti-pill teal" aria-hidden="true" />
                    Current Medications
                  </div>
                  <div className="record-section-body">
                    {patient.prescriptions.map((rx) => (
                      <div key={rx.name} style={{ marginBottom: 10 }}>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 500,
                            color: "var(--text-primary)",
                          }}
                        >
                          {rx.name}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: "var(--text-muted)",
                            fontWeight: 300,
                          }}
                        >
                          {rx.dosage} • {rx.frequency} • {rx.duration}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {recordTab === "Attachments" && (
                <div
                  style={{
                    padding: 16,
                    textAlign: "center",
                    color: "var(--text-muted)",
                    fontSize: 14,
                  }}
                >
                  <i
                    className="ti ti-paperclip"
                    style={{ fontSize: 32, display: "block", marginBottom: 8 }}
                    aria-hidden="true"
                  />
                  No attachments yet
                </div>
              )}

              {recordTab === "Last Encounter" && (
                <div className="record-section">
                  <div className="record-section-header">
                    <i className="ti ti-file-text teal" aria-hidden="true" />
                    Last Encounter
                  </div>
                  <div className="record-section-body">
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--text-muted)",
                        marginBottom: 6,
                      }}
                    >
                      Oct 12, 2023 • Dr. Ahmad
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: "var(--text-primary)",
                        lineHeight: 1.6,
                        fontWeight: 300,
                      }}
                    >
                      Patient presented for follow-up. Blood pressure slightly
                      elevated at 138/88. Medication compliance confirmed.
                      Dietary advice given. Follow-up in 4 weeks.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
