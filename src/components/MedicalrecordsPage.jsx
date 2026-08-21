import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import "./styles/Layout.css";
import "./styles/Medicalrecords.css";
import "./styles/Appointments.css";
import { useClinic } from "../context/ClinicContext";
import { useTranslation } from "../i18n/useTranslation";
import { getDoctorAppointments, startAppointment } from "../api/Appointments";
import { getAppointmentMedicalRecord } from "../api/MedicalRecords";
import { getEncounter, submitEncounter } from "../api/Encounters";

const EMPTY_RX = {
  drug_name: "",
  form: "",
  dosage: "",
  frequency: "",
  duration: "",
  route: "",
  notes: "",
};

const MEDICATION_ROUTES = [
  "oral",
  "iv",
  "im",
  "subcutaneous",
  "inhalation",
  "topical",
  "rectal",
  "nasal",
  "ophthalmic",
  "otic",
  "transdermal",
];

const RECORD_TABS = [
  { key: "Medical History", labelKey: "medicalRecords.medicalHistory" },
  { key: "Medications", labelKey: "medicalRecords.medications" },
  { key: "Attachments", labelKey: "medicalRecords.attachments" },
  { key: "Encounters", labelKey: "medicalRecords.encounters" },
];

function initialsOf(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return `${first}${last}`.toUpperCase() || "?";
}

function formatSlotTime(slot, walkInLabel) {
  if (!slot?.starts_at) return walkInLabel;
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
  const { t } = useTranslation();

  const [queueTab, setQueueTab] = useState("active"); // "active" | "completed"
  const [queue, setQueue] = useState([]);
  const [queueLoading, setQueueLoading] = useState(true);
  const [queueError, setQueueError] = useState("");

  const [activeAppointmentId, setActiveAppointmentId] = useState(null);
  const [recordTab, setRecordTab] = useState("Medical History");

  const [recordData, setRecordData] = useState(null); // { access_level, patient, medical_record }
  const [recordLoading, setRecordLoading] = useState(false);
  const [recordError, setRecordError] = useState("");

  // The encounter tied to the currently-selected appointment specifically
  // (not the patient's whole history) — this is what gets written to.
  const [currentEncounter, setCurrentEncounter] = useState(null);
  const [encounterLoading, setEncounterLoading] = useState(false);
  const [encounterError, setEncounterError] = useState("");

  const [startingConsult, setStartingConsult] = useState(false);
  const [startError, setStartError] = useState("");

  // Notes, diagnoses, and prescription items are staged here locally —
  // "Add" just pushes onto these arrays, no network call — then a single
  // "Submit encounter" sends everything together in one POST .../submit
  // request (SubmitEncounterRequest on the backend takes all three
  // sections in one payload; using it instead of three separate per-item
  // requests is what was asked for here).
  const [noteInput, setNoteInput] = useState("");
  const [draftNotes, setDraftNotes] = useState([]);

  const [diagnosisLabel, setDiagnosisLabel] = useState("");
  const [diagnosisDescription, setDiagnosisDescription] = useState("");
  const [draftDiagnoses, setDraftDiagnoses] = useState([]);

  const [rxForm, setRxForm] = useState(EMPTY_RX);
  const [draftItems, setDraftItems] = useState([]);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");

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

  // Load the encounter for THIS specific visit (separate from the
  // patient's history list inside the medical record response).
  useEffect(() => {
    if (!activeAppointmentId) return;
    setEncounterLoading(true);
    setEncounterError("");
    setCurrentEncounter(null);
    setNoteInput("");
    setDiagnosisLabel("");
    setDiagnosisDescription("");
    setRxForm(EMPTY_RX);
    setDraftNotes([]);
    setDraftDiagnoses([]);
    setDraftItems([]);
    setSubmitError("");
    setSubmitSuccess("");
    getEncounter(activeAppointmentId)
      .then(setCurrentEncounter)
      .catch((err) =>
        setEncounterError(
          err.message || "Couldn't load this visit's documentation.",
        ),
      )
      .finally(() => setEncounterLoading(false));
  }, [activeAppointmentId]);

  const activeAppointment = queue.find((a) => a.id === activeAppointmentId);
  const canWrite = activeAppointment?.status === "in_progress";

  async function handleStartConsultation() {
    if (!activeAppointmentId) return;
    setStartingConsult(true);
    setStartError("");
    try {
      const updated = await startAppointment(activeAppointmentId);
      setQueue((list) => list.map((a) => (a.id === updated.id ? updated : a)));
    } catch (err) {
      setStartError(err.message || "Couldn't start the consultation.");
    } finally {
      setStartingConsult(false);
    }
  }

  function handleAddNote(e) {
    e.preventDefault();
    if (!noteInput.trim()) return;
    setDraftNotes((prev) => [...prev, noteInput.trim()]);
    setNoteInput("");
  }

  function handleAddDiagnosis(e) {
    e.preventDefault();
    if (!diagnosisLabel.trim()) return;
    setDraftDiagnoses((prev) => [
      ...prev,
      { label: diagnosisLabel.trim(), description: diagnosisDescription.trim() },
    ]);
    setDiagnosisLabel("");
    setDiagnosisDescription("");
  }

  function handleAddPrescriptionItem(e) {
    e.preventDefault();
    if (!rxForm.drug_name.trim()) return;
    setDraftItems((prev) => [...prev, { ...rxForm, drug_name: rxForm.drug_name.trim() }]);
    setRxForm(EMPTY_RX);
  }

  async function handleSubmitEncounter() {
    if (draftNotes.length === 0 && draftDiagnoses.length === 0 && draftItems.length === 0) {
      setSubmitError("Add at least one note, diagnosis, or prescription item before submitting.");
      return;
    }
    setSubmitting(true);
    setSubmitError("");
    setSubmitSuccess("");
    try {
      // Everything staged above goes in a single request — the backend's
      // /submit endpoint takes notes, diagnoses, and prescription_items
      // together rather than as three separate calls.
      const encounter = await submitEncounter(activeAppointmentId, {
        notes: draftNotes.map((content) => ({ content })),
        diagnoses: draftDiagnoses.map((d) => ({
          label: d.label,
          description: d.description || undefined,
        })),
        prescription_items: draftItems.map((i) => ({
          drug_name: i.drug_name,
          form: i.form || undefined,
          dosage: i.dosage || undefined,
          frequency: i.frequency || undefined,
          duration: i.duration || undefined,
          route: i.route || undefined,
          notes: i.notes || undefined,
        })),
      });

      setCurrentEncounter(encounter);
      setDraftNotes([]);
      setDraftDiagnoses([]);
      setDraftItems([]);
      setSubmitSuccess(t("medicalRecords.submitSuccess") || "Encounter submitted successfully.");
    } catch (err) {
      setSubmitError(
        err.errors ? Object.values(err.errors)[0][0] : err.message || "Failed to submit encounter.",
      );
    } finally {
      setSubmitting(false);
    }
  }

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
        <Topbar searchPlaceholder={t("topbar.searchDefault")} />

        <main className="page-content">
          <div className="medrecords-layout">
            {/* ── Queue panel ── */}
            <div className="queue-panel">
              <div className="queue-toggle">
                <button
                  className={`queue-toggle-btn${queueTab === "active" ? " active" : ""}`}
                  onClick={() => setQueueTab("active")}
                >
                  {t("medicalRecords.checkedIn")}
                </button>
                <button
                  className={`queue-toggle-btn${queueTab === "completed" ? " active" : ""}`}
                  onClick={() => setQueueTab("completed")}
                >
                  {t("medicalRecords.completedTab")}
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
                    {t("doctorDashboard.loading")}
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
                      ? t("medicalRecords.noActivePatients")
                      : t("medicalRecords.noCompletedAppointments")}
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
                      {formatSlotTime(apt.slot, t("appointments.walkIn"))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Workspace ── */}
            <div className="workspace-panel">
              {recordLoading && (
                <p style={{ padding: 24, color: "var(--text-muted)" }}>
                  {t("medicalRecords.loadingRecord")}
                </p>
              )}

              {!recordLoading && recordError && (
                <div style={{ padding: 24 }}>
                  <div className="apt-banner apt-banner-error">
                    {recordError}
                  </div>
                  <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
                    {t("medicalRecords.accessNote")}
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
                            ? t("medicalRecords.fullAccess")
                            : t("medicalRecords.readOnlyAccess")}
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
                    {startError && (
                      <div className="apt-banner apt-banner-error">
                        {startError}
                      </div>
                    )}
                    {encounterError && (
                      <div className="apt-banner apt-banner-error">
                        {encounterError}
                      </div>
                    )}

                    {encounterLoading && (
                      <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
                        {t("medicalRecords.loadingDocumentation")}
                      </p>
                    )}

                    {!encounterLoading && !canWrite && (
                      <div className="ws-card">
                        <div className="ws-card-header">
                          <div className="ws-card-title">
                            <i
                              className="ti ti-stethoscope"
                              aria-hidden="true"
                            />
                            {t("medicalRecords.clinicalDocumentation")}
                          </div>
                        </div>
                        {activeAppointment?.status === "checked_in" ? (
                          <div style={{ padding: "0 4px 4px" }}>
                            <p
                              style={{
                                fontSize: 13,
                                color: "var(--text-muted)",
                              }}
                            >
                              {t("medicalRecords.inProgressOnlyNote")}
                            </p>
                            <button
                              className="btn-dark"
                              disabled={startingConsult}
                              onClick={handleStartConsultation}
                            >
                              {startingConsult
                                ? t("medicalRecords.starting")
                                : t("medicalRecords.startConsultation")}
                            </button>
                          </div>
                        ) : (
                          <p
                            style={{
                              fontSize: 13,
                              color: "var(--text-muted)",
                              padding: "0 4px 4px",
                            }}
                          >
                            {activeAppointment
                              ? t("medicalRecords.notInProgressNote")
                              : t("medicalRecords.selectPatientNote")}
                          </p>
                        )}
                      </div>
                    )}

                    {!encounterLoading && canWrite && (
                      <>
                        {submitError && (
                          <div className="apt-banner apt-banner-error">
                            {submitError}
                          </div>
                        )}
                        {submitSuccess && (
                          <div className="apt-banner apt-banner-success">
                            {submitSuccess}
                          </div>
                        )}

                        {/* Notes */}
                        <div className="ws-card">
                          <div className="ws-card-header">
                            <div className="ws-card-title">
                              <i className="ti ti-notes" aria-hidden="true" />
                              {t("medicalRecords.notes")}
                            </div>
                          </div>
                          {(currentEncounter?.clinical_notes || []).map((n) => (
                            <p
                              key={n.id}
                              style={{
                                fontSize: 13,
                                color: "var(--text-primary)",
                                padding: "0 4px",
                              }}
                            >
                              {n.content}
                            </p>
                          ))}
                          {draftNotes.map((content, i) => (
                            <div
                              key={i}
                              style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "0 4px" }}
                            >
                              <p
                                style={{
                                  fontSize: 13,
                                  color: "var(--text-secondary)",
                                  fontStyle: "italic",
                                  flex: 1,
                                  margin: 0,
                                }}
                              >
                                {content}
                              </p>
                              <button
                                type="button"
                                aria-label="Remove note"
                                onClick={() => setDraftNotes((prev) => prev.filter((_, idx) => idx !== i))}
                                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--red)" }}
                              >
                                <i className="ti ti-x" aria-hidden="true" />
                              </button>
                            </div>
                          ))}
                          <form
                            onSubmit={handleAddNote}
                            style={{ padding: "8px 4px 4px" }}
                          >
                            <textarea
                              className="modal-input"
                              rows={2}
                              maxLength={5000}
                              placeholder={t("medicalRecords.addNotePlaceholder")}
                              value={noteInput}
                              onChange={(e) => setNoteInput(e.target.value)}
                            />
                            <button
                              type="submit"
                              className="btn-outline"
                              style={{ marginTop: 8 }}
                              disabled={!noteInput.trim()}
                            >
                              {t("medicalRecords.addNote")}
                            </button>
                          </form>
                        </div>

                        {/* Diagnoses */}
                        <div className="ws-card">
                          <div className="ws-card-header">
                            <div className="ws-card-title">
                              <i
                                className="ti ti-report-medical"
                                aria-hidden="true"
                              />
                              {t("medicalRecords.diagnoses")}
                            </div>
                          </div>
                          {(currentEncounter?.diagnoses || []).map((d) => (
                            <p
                              key={d.id}
                              style={{
                                fontSize: 13,
                                color: "var(--text-primary)",
                                padding: "0 4px",
                              }}
                            >
                              <strong>{d.label}</strong>
                              {d.description ? ` — ${d.description}` : ""}
                            </p>
                          ))}
                          {draftDiagnoses.map((d, i) => (
                            <div
                              key={i}
                              style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "0 4px" }}
                            >
                              <p
                                style={{
                                  fontSize: 13,
                                  color: "var(--text-secondary)",
                                  fontStyle: "italic",
                                  flex: 1,
                                  margin: 0,
                                }}
                              >
                                <strong>{d.label}</strong>
                                {d.description ? ` — ${d.description}` : ""}
                              </p>
                              <button
                                type="button"
                                aria-label="Remove diagnosis"
                                onClick={() => setDraftDiagnoses((prev) => prev.filter((_, idx) => idx !== i))}
                                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--red)" }}
                              >
                                <i className="ti ti-x" aria-hidden="true" />
                              </button>
                            </div>
                          ))}
                          <form
                            onSubmit={handleAddDiagnosis}
                            style={{
                              padding: "8px 4px 4px",
                              display: "flex",
                              flexDirection: "column",
                              gap: 8,
                            }}
                          >
                            <input
                              type="text"
                              className="modal-input"
                              maxLength={255}
                              placeholder={t("medicalRecords.diagnosisLabel")}
                              value={diagnosisLabel}
                              onChange={(e) =>
                                setDiagnosisLabel(e.target.value)
                              }
                            />
                            <input
                              type="text"
                              className="modal-input"
                              maxLength={2000}
                              placeholder={t("medicalRecords.descriptionOptional")}
                              value={diagnosisDescription}
                              onChange={(e) =>
                                setDiagnosisDescription(e.target.value)
                              }
                            />
                            <button
                              type="submit"
                              className="btn-outline"
                              disabled={!diagnosisLabel.trim()}
                            >
                              {t("medicalRecords.addDiagnosis")}
                            </button>
                          </form>
                        </div>

                        {/* Prescription */}
                        <div className="ws-card">
                          <div className="ws-card-header">
                            <div className="ws-card-title">
                              <i className="ti ti-pill" aria-hidden="true" />
                              {t("medicalRecords.prescription")}
                            </div>
                          </div>
                          {(currentEncounter?.prescription?.items || []).map(
                            (item) => (
                              <p
                                key={item.id}
                                style={{
                                  fontSize: 13,
                                  color: "var(--text-primary)",
                                  padding: "0 4px",
                                }}
                              >
                                {item.drug}
                                {item.dosage ? ` — ${item.dosage}` : ""}
                                {item.frequency ? `, ${item.frequency}` : ""}
                                {item.duration ? ` for ${item.duration}` : ""}
                              </p>
                            ),
                          )}
                          {draftItems.map((item, i) => (
                            <div
                              key={i}
                              style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "0 4px" }}
                            >
                              <p
                                style={{
                                  fontSize: 13,
                                  color: "var(--text-secondary)",
                                  fontStyle: "italic",
                                  flex: 1,
                                  margin: 0,
                                }}
                              >
                                {item.drug_name}
                                {item.dosage ? ` — ${item.dosage}` : ""}
                                {item.frequency ? `, ${item.frequency}` : ""}
                                {item.duration ? ` for ${item.duration}` : ""}
                              </p>
                              <button
                                type="button"
                                aria-label="Remove prescription item"
                                onClick={() => setDraftItems((prev) => prev.filter((_, idx) => idx !== i))}
                                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--red)" }}
                              >
                                <i className="ti ti-x" aria-hidden="true" />
                              </button>
                            </div>
                          ))}
                          <form
                            onSubmit={handleAddPrescriptionItem}
                            style={{
                              padding: "8px 4px 4px",
                              display: "flex",
                              flexDirection: "column",
                              gap: 8,
                            }}
                          >
                            <input
                              type="text"
                              className="modal-input"
                              maxLength={150}
                              placeholder={t("medicalRecords.drugName")}
                              value={rxForm.drug_name}
                              onChange={(e) =>
                                setRxForm((f) => ({
                                  ...f,
                                  drug_name: e.target.value,
                                }))
                              }
                            />
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                gap: 8,
                              }}
                            >
                              <input
                                type="text"
                                className="modal-input"
                                maxLength={255}
                                placeholder={t("medicalRecords.dosagePlaceholder")}
                                value={rxForm.dosage}
                                onChange={(e) =>
                                  setRxForm((f) => ({
                                    ...f,
                                    dosage: e.target.value,
                                  }))
                                }
                              />
                              <input
                                type="text"
                                className="modal-input"
                                maxLength={255}
                                placeholder={t("medicalRecords.frequencyPlaceholder")}
                                value={rxForm.frequency}
                                onChange={(e) =>
                                  setRxForm((f) => ({
                                    ...f,
                                    frequency: e.target.value,
                                  }))
                                }
                              />
                              <input
                                type="text"
                                className="modal-input"
                                maxLength={255}
                                placeholder={t("medicalRecords.durationPlaceholder")}
                                value={rxForm.duration}
                                onChange={(e) =>
                                  setRxForm((f) => ({
                                    ...f,
                                    duration: e.target.value,
                                  }))
                                }
                              />
                              <select
                                className="modal-select"
                                value={rxForm.route}
                                onChange={(e) =>
                                  setRxForm((f) => ({
                                    ...f,
                                    route: e.target.value,
                                  }))
                                }
                              >
                                <option value="">{t("medicalRecords.routeOptional")}</option>
                                {MEDICATION_ROUTES.map((r) => (
                                  <option key={r} value={r}>
                                    {r}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <button
                              type="submit"
                              className="btn-outline"
                              disabled={!rxForm.drug_name.trim()}
                            >
                              {t("medicalRecords.addPrescriptionItem")}
                            </button>
                          </form>
                        </div>

                        <button
                          type="button"
                          className="btn-dark"
                          style={{ margin: "4px 4px 8px" }}
                          disabled={
                            submitting ||
                            (draftNotes.length === 0 &&
                              draftDiagnoses.length === 0 &&
                              draftItems.length === 0)
                          }
                          onClick={handleSubmitEncounter}
                        >
                          {submitting ? "Submitting…" : "Submit Encounter"}
                        </button>
                      </>
                    )}

                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: "var(--text-muted)",
                        letterSpacing: "0.4px",
                        margin: "20px 4px 8px",
                      }}
                    >
                      {t("medicalRecords.previousEncounters")}
                    </div>

                    {encounters.filter(
                      (enc) => enc.appointment_id !== activeAppointmentId,
                    ).length === 0 ? (
                      <div
                        style={{
                          padding: 24,
                          textAlign: "center",
                          color: "var(--text-muted)",
                          fontSize: 13,
                        }}
                      >
                        {t("medicalRecords.noPreviousEncounters")}
                      </div>
                    ) : (
                      encounters
                        .filter(
                          (enc) => enc.appointment_id !== activeAppointmentId,
                        )
                        .map((enc) => (
                          <div className="ws-card" key={enc.id}>
                            <div className="ws-card-header">
                              <div className="ws-card-title">
                                <i
                                  className="ti ti-file-text"
                                  aria-hidden="true"
                                />
                                {t("medicalRecords.encounters")} — {enc.visit_type || "visit"}
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
                                  {t("medicalRecords.notes").toUpperCase()}
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
                                  {t("medicalRecords.diagnoses").toUpperCase()}
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
                                  {t("medicalRecords.prescription").toUpperCase()}
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
                                    {item.duration
                                      ? `for ${item.duration}`
                                      : ""}
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
                  {t("medicalRecords.selectPatient")}
                </div>
              )}
            </div>

            {/* ── Record sidebar ── */}
            {patient && (
              <div className="record-panel">
                <div className="record-panel-header">
                  <span className="record-panel-title">{t("medicalRecords.medicalRecordTitle")}</span>
                </div>

                <div className="record-tabs">
                  {RECORD_TABS.map(({ key, labelKey }) => (
                    <button
                      key={key}
                      className={`record-tab${recordTab === key ? " active" : ""}`}
                      onClick={() => setRecordTab(key)}
                    >
                      {t(labelKey)}
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
                          {t("medicalRecords.chronicConditions")}
                        </div>
                        <div className="record-section-body">
                          {conditions.length === 0 ? (
                            <div
                              style={{
                                fontSize: 13,
                                color: "var(--text-muted)",
                              }}
                            >
                              {t("medicalRecords.noneRecorded")}
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
                          {t("medicalRecords.allergies")}
                        </div>
                        <div className="record-section-body">
                          {allergies.length === 0 ? (
                            <div
                              style={{
                                fontSize: 13,
                                color: "var(--text-muted)",
                              }}
                            >
                              {t("medicalRecords.noneKnown")}
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
                          {t("medicalRecords.surgeries")}
                        </div>
                        <div className="record-section-body">
                          {surgeries.length === 0 ? (
                            <div
                              style={{
                                fontSize: 13,
                                color: "var(--text-muted)",
                              }}
                            >
                              {t("medicalRecords.noneRecorded")}
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
                          {t("medicalRecords.familyHistory")}
                        </div>
                        <div className="record-section-body">
                          {family.length === 0 ? (
                            <div
                              style={{
                                fontSize: 13,
                                color: "var(--text-muted)",
                              }}
                            >
                              {t("medicalRecords.noneRecorded")}
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
                        {t("medicalRecords.medications")}
                      </div>
                      <div className="record-section-body">
                        {medications.length === 0 ? (
                          <div
                            style={{ fontSize: 13, color: "var(--text-muted)" }}
                          >
                            {t("medicalRecords.noneRecorded")}
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
                          {t("medicalRecords.noAttachmentsYet")}
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
                        {t("medicalRecords.encounters")}
                      </div>
                      <div className="record-section-body">
                        {encounters.length === 0 ? (
                          <div
                            style={{ fontSize: 13, color: "var(--text-muted)" }}
                          >
                            {t("medicalRecords.noneRecorded")}
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
