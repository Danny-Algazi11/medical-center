import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import "./styles/Layout.css";
import "./styles/Medicalrecords.css";
import "./styles/Appointments.css";
import { useClinic } from "../context/ClinicContext";
import { getDoctorAppointments } from "../api/Appointments";
import { getAppointmentMedicalRecord } from "../api/MedicalRecords";

const RECORD_TABS = [
  "Medical History",
  "Medications",
  "Attachments",
  "Encounters",
];

function initialsOf(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return `${first}${last}`.toUpperCase() || "?";
}

function formatSlotTime(slot) {
  if (!slot?.starts_at) return "Walk-in";
  const d = new Date(slot.starts_at);
  if (Number.isNaN(d.getTime())) return slot.starts_at;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MedicalRecordsPage() {
  const { selectedClinicId } = useClinic();

  const [queueTab, setQueueTab] = useState("active"); // "active" | "completed"
  const [queue, setQueue] = useState([]);
  const [queueLoading, setQueueLoading] = useState(true);
  const [queueError, setQueueError] = useState("");

  const [activeAppointmentId, setActiveAppointmentId] = useState(null);
  const [recordTab, setRecordTab] = useState("Medical History");

  const [recordData, setRecordData] = useState(null); // { access_level, patient, medical_record }
  const [recordLoading, setRecordLoading] = useState(false);
  const [recordError, setRecordError] = useState("");

  // Load the queue — "active" merges checked_in + in_progress (the two
  // states AccessGuard grants full access for); "completed" intentionally
  // included even though AccessGuard denies access to completed
  // appointments, so that denial is visible rather than hidden.
  // Same as AppointmentsPage: doctor appointments have no clinic_id
  // filter server-side, so the selected clinic is applied client-side.
  useEffect(() => {
    setQueueLoading(true);
    setQueueError("");
    setActiveAppointmentId(null);
    setRecordData(null);

    const loaders =
      queueTab === "active"
        ? [
            getDoctorAppointments({ status: "checked_in" }),
            getDoctorAppointments({ status: "in_progress" }),
          ]
        : [getDoctorAppointments({ status: "completed" })];

    Promise.all(loaders)
      .then((results) => {
        let merged = results.flatMap((r) => r.items);
        if (selectedClinicId) {
          merged = merged.filter((a) => a.clinic?.id === selectedClinicId);
        }
        merged.sort((a, b) => {
          const ta = a.slot?.starts_at
            ? new Date(a.slot.starts_at).getTime()
            : 0;
          const tb = b.slot?.starts_at
            ? new Date(b.slot.starts_at).getTime()
            : 0;
          return ta - tb;
        });
        setQueue(merged);
        if (merged.length > 0) setActiveAppointmentId(merged[0].id);
      })
      .catch((err) =>
        setQueueError(err.message || "Couldn't load appointment queue."),
      )
      .finally(() => setQueueLoading(false));
  }, [queueTab, selectedClinicId]);

  // Load the medical record for whichever appointment is selected.
  useEffect(() => {
    if (!activeAppointmentId) return;
    setRecordLoading(true);
    setRecordError("");
    setRecordData(null);
    getAppointmentMedicalRecord(activeAppointmentId)
      .then(setRecordData)
      .catch((err) =>
        setRecordError(
          err.message ||
            "You do not currently have access to this patient's medical record.",
        ),
      )
      .finally(() => setRecordLoading(false));
  }, [activeAppointmentId]);

  const patient = recordData?.patient;
  const record = recordData?.medical_record;
  const allergies = record?.medical_history?.allergies || [];
  const conditions = record?.medical_history?.chronic_conditions || [];
  const surgeries = record?.medical_history?.surgeries || [];
  const family = record?.medical_history?.family_history || [];
  const medications = record?.medications || [];
  const attachments = record?.attachments || [];
  const encounters = record?.encounters || [];

  return (
    <div className="layout-shell">
      <Sidebar />
      <div className="layout-main">
        <Topbar searchPlaceholder="Search patients..." />

        <main className="page-content">
          <div className="medrecords-layout">
            {/* ── Queue panel ── */}
            <div className="queue-panel">
              <div className="queue-toggle">
                <button
                  className={`queue-toggle-btn${queueTab === "active" ? " active" : ""}`}
                  onClick={() => setQueueTab("active")}
                >
                  Checked-in
                </button>
                <button
                  className={`queue-toggle-btn${queueTab === "completed" ? " active" : ""}`}
                  onClick={() => setQueueTab("completed")}
                >
                  Completed
                </button>
              </div>

              {queueError && (
                <p
                  style={{
                    padding: "0 16px",
                    fontSize: 13,
                    color: "var(--red)",
                  }}
                >
                  {queueError}
                </p>
              )}

              <div className="queue-list">
                {queueLoading && (
                  <p
                    style={{
                      padding: 16,
                      fontSize: 13,
                      color: "var(--text-muted)",
                    }}
                  >
                    Loading…
                  </p>
                )}
                {!queueLoading && queue.length === 0 && (
                  <p
                    style={{
                      padding: 16,
                      fontSize: 13,
                      color: "var(--text-muted)",
                    }}
                  >
                    {queueTab === "active"
                      ? "No checked-in or in-progress patients right now."
                      : "No completed appointments found."}
                  </p>
                )}
                {queue.map((apt) => (
                  <div
                    key={apt.id}
                    className={`queue-item${activeAppointmentId === apt.id ? " active" : ""}`}
                    onClick={() => setActiveAppointmentId(apt.id)}
                  >
                    <div className="queue-item-top">
                      <span className="queue-item-name">
                        {apt.patient?.name || "—"}
                      </span>
                      <span className={`queue-status-dot ${apt.status}`}>
                        {apt.status.replace("_", " ").toUpperCase()}
                      </span>
                    </div>
                    <div className="queue-item-sub">
                      {formatSlotTime(apt.slot)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Workspace ── */}
            <div className="workspace-panel">
              {recordLoading && (
                <p style={{ padding: 24, color: "var(--text-muted)" }}>
                  Loading medical record…
                </p>
              )}

              {!recordLoading && recordError && (
                <div style={{ padding: 24 }}>
                  <div className="apt-banner apt-banner-error">
                    {recordError}
                  </div>
                  <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
                    Access to a patient's record is only granted while an
                    appointment is checked-in or in progress, or starting 48
                    hours before a scheduled visit — never once it's completed,
                    cancelled, or marked no-show.
                  </p>
                </div>
              )}

              {!recordLoading && !recordError && patient && (
                <>
                  <div className="patient-banner">
                    <div className="banner-avatar">
                      {initialsOf(patient.name)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <h2 className="banner-name">{patient.name}</h2>
                        {allergies.map((a) => (
                          <span
                            key={a.id}
                            className={`allergy-tag ${a.severity === "severe" ? "critical" : "normal"}`}
                          >
                            {a.allergen}
                          </span>
                        ))}
                      </div>
                      <div className="banner-meta">
                        <span>
                          {patient.age != null ? `${patient.age}Y` : "—"}
                        </span>
                        <span className="banner-sep">•</span>
                        <span>{patient.gender || "—"}</span>
                        <span className="banner-sep">•</span>
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <i
                            className="ti ti-droplet"
                            style={{ fontSize: 13, color: "var(--red)" }}
                            aria-hidden="true"
                          />
                          {patient.blood_type || "—"}
                        </span>
                        <span className="banner-sep">•</span>
                        <span
                          style={{
                            fontSize: 11,
                            textTransform: "uppercase",
                            fontWeight: 600,
                            color:
                              recordData.access_level === "full"
                                ? "var(--green)"
                                : "var(--amber)",
                          }}
                        >
                          {recordData.access_level === "full"
                            ? "Full access"
                            : "Read-only access"}
                        </span>
                      </div>
                    </div>
                    <div className="banner-tags">
                      {conditions.map((c) => (
                        <span key={c.id} className="condition-tag">
                          {c.condition_name}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="workspace-scroll">
                    <div className="ws-card">
                      <div className="ws-card-header">
                        <div className="ws-card-title">
                          <i className="ti ti-stethoscope" aria-hidden="true" />
                          Clinical Documentation
                        </div>
                        <span className="ws-card-badge">READ-ONLY FOR NOW</span>
                      </div>
                      <p
                        style={{
                          fontSize: 13,
                          color: "var(--text-muted)",
                          padding: "0 4px 4px",
                        }}
                      >
                        Adding notes, diagnoses, or prescriptions during a visit
                        isn't available yet — it's blocked by a backend bug, not
                        a missing feature here. Existing encounters for this
                        patient are shown below.
                      </p>
                    </div>

                    {encounters.length === 0 ? (
                      <div
                        style={{
                          padding: 24,
                          textAlign: "center",
                          color: "var(--text-muted)",
                          fontSize: 13,
                        }}
                      >
                        No encounters recorded for this patient yet.
                      </div>
                    ) : (
                      encounters.map((enc) => (
                        <div className="ws-card" key={enc.id}>
                          <div className="ws-card-header">
                            <div className="ws-card-title">
                              <i
                                className="ti ti-file-text"
                                aria-hidden="true"
                              />
                              Encounter — {enc.visit_type || "visit"}
                            </div>
                            <span className="ws-card-badge">
                              {enc.created_at}
                            </span>
                          </div>
                          {enc.clinical_notes.length > 0 && (
                            <div style={{ padding: "0 4px 10px" }}>
                              <div
                                style={{
                                  fontSize: 11,
                                  fontWeight: 600,
                                  color: "var(--text-muted)",
                                  marginBottom: 4,
                                }}
                              >
                                NOTES
                              </div>
                              {enc.clinical_notes.map((n) => (
                                <p
                                  key={n.id}
                                  style={{
                                    fontSize: 13,
                                    color: "var(--text-primary)",
                                  }}
                                >
                                  {n.content}
                                </p>
                              ))}
                            </div>
                          )}
                          {enc.diagnoses.length > 0 && (
                            <div style={{ padding: "0 4px 10px" }}>
                              <div
                                style={{
                                  fontSize: 11,
                                  fontWeight: 600,
                                  color: "var(--text-muted)",
                                  marginBottom: 4,
                                }}
                              >
                                DIAGNOSES
                              </div>
                              {enc.diagnoses.map((d) => (
                                <p
                                  key={d.id}
                                  style={{
                                    fontSize: 13,
                                    color: "var(--text-primary)",
                                  }}
                                >
                                  <strong>{d.label}</strong>
                                  {d.description ? ` — ${d.description}` : ""}
                                </p>
                              ))}
                            </div>
                          )}
                          {enc.prescription?.items?.length > 0 && (
                            <div style={{ padding: "0 4px 4px" }}>
                              <div
                                style={{
                                  fontSize: 11,
                                  fontWeight: 600,
                                  color: "var(--text-muted)",
                                  marginBottom: 4,
                                }}
                              >
                                PRESCRIPTION
                              </div>
                              {enc.prescription.items.map((item) => (
                                <p
                                  key={item.id}
                                  style={{
                                    fontSize: 13,
                                    color: "var(--text-primary)",
                                  }}
                                >
                                  {item.drug} — {item.dosage} {item.frequency}{" "}
                                  {item.duration ? `for ${item.duration}` : ""}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}

              {!recordLoading && !recordError && !patient && (
                <div style={{ padding: 24, color: "var(--text-muted)" }}>
                  Select a patient from the queue on the left.
                </div>
              )}
            </div>

            {/* ── Record sidebar ── */}
            {patient && (
              <div className="record-panel">
                <div className="record-panel-header">
                  <span className="record-panel-title">Medical Record</span>
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
                      <div className="record-section">
                        <div className="record-section-header">
                          <i
                            className="ti ti-heart-rate-monitor teal"
                            aria-hidden="true"
                          />
                          Chronic Conditions
                        </div>
                        <div className="record-section-body">
                          {conditions.length === 0 ? (
                            <div
                              style={{
                                fontSize: 13,
                                color: "var(--text-muted)",
                              }}
                            >
                              None recorded
                            </div>
                          ) : (
                            conditions.map((c) => (
                              <div key={c.id} className="record-item">
                                {c.condition_name}
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      <div className="record-section">
                        <div className="record-section-header">
                          <i
                            className="ti ti-alert-triangle red"
                            aria-hidden="true"
                          />
                          Allergies
                        </div>
                        <div className="record-section-body">
                          {allergies.length === 0 ? (
                            <div
                              style={{
                                fontSize: 13,
                                color: "var(--text-muted)",
                              }}
                            >
                              None known
                            </div>
                          ) : (
                            allergies.map((a) => (
                              <div key={a.id} className="record-item allergy">
                                {a.allergen}
                                {a.reaction ? ` (${a.reaction})` : ""}
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      <div className="record-section">
                        <div className="record-section-header">
                          <i
                            className="ti ti-surgical-staple green"
                            aria-hidden="true"
                          />
                          Surgeries
                        </div>
                        <div className="record-section-body">
                          {surgeries.length === 0 ? (
                            <div
                              style={{
                                fontSize: 13,
                                color: "var(--text-muted)",
                              }}
                            >
                              None recorded
                            </div>
                          ) : (
                            surgeries.map((s) => (
                              <div key={s.id} className="record-row">
                                <div className="record-item">
                                  {s.surgery_name}
                                </div>
                                <div className="record-year">
                                  {s.surgery_date}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      <div className="record-section">
                        <div className="record-section-header">
                          <i className="ti ti-users amber" aria-hidden="true" />
                          Family History
                        </div>
                        <div className="record-section-body">
                          {family.length === 0 ? (
                            <div
                              style={{
                                fontSize: 13,
                                color: "var(--text-muted)",
                              }}
                            >
                              None recorded
                            </div>
                          ) : (
                            family.map((f) => (
                              <div key={f.id} className="record-row">
                                <div className="record-item">{f.condition}</div>
                                <div className="record-year">{f.relation}</div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {recordTab === "Medications" && (
                    <div className="record-section">
                      <div className="record-section-header">
                        <i className="ti ti-pill teal" aria-hidden="true" />
                        Medications
                      </div>
                      <div className="record-section-body">
                        {medications.length === 0 ? (
                          <div
                            style={{ fontSize: 13, color: "var(--text-muted)" }}
                          >
                            None recorded
                          </div>
                        ) : (
                          medications.map((m) => (
                            <div key={m.id} style={{ marginBottom: 10 }}>
                              <div
                                style={{
                                  fontSize: 13,
                                  fontWeight: 500,
                                  color: "var(--text-primary)",
                                }}
                              >
                                {m.drug_name || "Unknown drug"}{" "}
                                {m.status === "active" ? "" : `(${m.status})`}
                              </div>
                              <div
                                style={{
                                  fontSize: 12,
                                  color: "var(--text-muted)",
                                  fontWeight: 300,
                                }}
                              >
                                {[m.dosage, m.frequency, m.route]
                                  .filter(Boolean)
                                  .join(" • ")}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {recordTab === "Attachments" && (
                    <div className="record-section">
                      {attachments.length === 0 ? (
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
                            style={{
                              fontSize: 32,
                              display: "block",
                              marginBottom: 8,
                            }}
                            aria-hidden="true"
                          />
                          No attachments yet
                        </div>
                      ) : (
                        attachments.map((a) => (
                          <div key={a.id} className="record-row">
                            <div className="record-item">
                              {a.type} ({Math.round((a.file_size || 0) / 1024)}{" "}
                              KB)
                            </div>
                            <div className="record-year">{a.uploaded_at}</div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {recordTab === "Encounters" && (
                    <div className="record-section">
                      <div className="record-section-header">
                        <i
                          className="ti ti-file-text teal"
                          aria-hidden="true"
                        />
                        Encounters
                      </div>
                      <div className="record-section-body">
                        {encounters.length === 0 ? (
                          <div
                            style={{ fontSize: 13, color: "var(--text-muted)" }}
                          >
                            None recorded
                          </div>
                        ) : (
                          encounters.map((e) => (
                            <div key={e.id} className="record-row">
                              <div className="record-item">
                                {e.visit_type || "Visit"}
                              </div>
                              <div className="record-year">{e.created_at}</div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
