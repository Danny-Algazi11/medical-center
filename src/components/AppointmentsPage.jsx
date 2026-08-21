import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { useAuth } from "../context/AuthContext";
import { useClinic } from "../context/ClinicContext";
import { useTranslation } from "../i18n/useTranslation";
import "./styles/Layout.css";
import "./styles/Appointments.css";
import {
  getDoctorAppointments,
  startAppointment,
  completeAppointment,
  cancelDoctorAppointment,
  markDoctorNoShow,
  getReceptionistAppointments,
  checkInAppointment,
  cancelReceptionistAppointment,
  markReceptionistNoShow,
  receptionistBookAppointment,
  createWalkIn,
} from "../api/Appointments";
import { searchDoctorsByClinic, getDoctorAvailability } from "../api/Schedule";
import { searchPatients } from "../api/Patients";
import { getPatientProfile } from "../api/MedicalRecords";

// Matches App\Core\Enums\AppointmentStatus exactly.
function statusMeta(t) {
  return {
    scheduled: { label: t("appointments.scheduled"), badge: "scheduled" },
    checked_in: { label: t("appointments.checkIn"), badge: "checked-in" },
    in_progress: { label: t("appointments.inProgress"), badge: "in-progress" },
    completed: { label: t("doctorDashboard.completed"), badge: "completed" },
    cancelled: { label: t("appointments.cancel"), badge: "cancelled" },
    no_show: { label: t("appointments.noShow"), badge: "no-show" },
  };
}

function filterTabs(t) {
  return [
    { value: "", label: t("appointments.all") },
    { value: "scheduled", label: t("appointments.scheduled") },
    { value: "checked_in", label: t("appointments.checkIn") },
    { value: "in_progress", label: t("appointments.inProgress") },
    { value: "completed", label: t("doctorDashboard.completed") },
    { value: "cancelled", label: t("appointments.cancel") },
    { value: "no_show", label: t("appointments.noShow") },
  ];
}

// Matches App\Core\Enums\ConsultationType.
function encounterLabels(t) {
  return { chat: t("appointments.chat"), in_person: t("appointments.inPerson") };
}

const TERMINAL_STATUSES = ["completed", "cancelled", "no_show"];

function formatSlot(slot) {
  if (!slot?.starts_at) return null;
  const d = new Date(slot.starts_at);
  if (Number.isNaN(d.getTime())) return null;
  return {
    date: d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    time: d.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

function initialsOf(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return `${first}${last}`.toUpperCase() || "?";
}

// role:doctor can act from checked_in (start) / in_progress (complete) /
// scheduled (no-show); role:receptionist can act from scheduled (check-in,
// no-show). Both can cancel anything non-terminal. Matches
// AppointmentStatusService's transition rules exactly.
function availableActions(role, status) {
  const actions = [];
  if (role === "doctor") {
    if (status === "checked_in") actions.push("start");
    if (status === "in_progress") actions.push("complete");
    if (status === "scheduled") actions.push("no-show");
  } else if (role === "receptionist") {
    if (status === "scheduled") {
      actions.push("check-in");
      actions.push("no-show");
    }
  }
  if (!TERMINAL_STATUSES.includes(status)) actions.push("cancel");
  return actions;
}

// ── New appointment / walk-in modal — receptionist only ─────────────
// ── Patient info modal — opened by clicking a patient in the table,
// doctor role only ────────────────────────────────────────────────
function PatientProfileModal({ patientId, onClose }) {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    getPatientProfile(patientId)
      .then(setData)
      .catch((err) => setError(err.message || "Couldn't load patient info."))
      .finally(() => setLoading(false));
  }, [patientId]);

  const patient = data?.patient;
  const encounters = data?.encounters || [];

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal" style={{ maxWidth: 520 }}>
        <div className="modal-header">
          <div>
            <h2>{t("appointments.patientInfo")}</h2>
            <p>{t("appointments.patientInfoDesc")}</p>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <i className="ti ti-x" aria-hidden="true" />
          </button>
        </div>

        <div
          className="modal-form"
          style={{ padding: "20px 28px", overflowY: "auto" }}
        >
          {loading && (
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
              {t("doctorDashboard.loading")}
            </p>
          )}
          {!loading && error && (
            <div className="apt-banner apt-banner-error">{error}</div>
          )}

          {!loading && !error && patient && (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  marginBottom: 18,
                }}
              >
                <div
                  className="patient-avatar"
                  style={{ width: 44, height: 44 }}
                >
                  {initialsOf(patient.name)}
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>
                    {patient.name || "—"}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                    {patient.age != null ? `${patient.age}Y` : "—"} ·{" "}
                    {patient.gender || "—"} ·{" "}
                    {patient.blood_type || "Blood type unknown"}
                  </div>
                </div>
              </div>

              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  letterSpacing: "0.4px",
                  marginBottom: 8,
                }}
              >
                {t("appointments.encounterHistory").toUpperCase()}
              </div>

              {encounters.length === 0 ? (
                <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
                  {t("appointments.noEncounters")}
                </p>
              ) : (
                encounters.map((enc) => (
                  <div
                    key={enc.id}
                    style={{
                      border: "1px solid var(--card-border)",
                      borderRadius: 9,
                      padding: 12,
                      marginBottom: 10,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 12,
                        color: "var(--text-muted)",
                        marginBottom: 6,
                      }}
                    >
                      <span>{enc.visit_type || "visit"}</span>
                      <span>{enc.created_at}</span>
                    </div>
                    {enc.clinical_notes?.map((n) => (
                      <p
                        key={n.id}
                        style={{ fontSize: 13, color: "var(--text-primary)" }}
                      >
                        {n.content}
                      </p>
                    ))}
                    {enc.diagnoses?.map((d) => (
                      <p
                        key={d.id}
                        style={{ fontSize: 13, color: "var(--text-primary)" }}
                      >
                        <strong>{d.label}</strong>
                        {d.description ? ` — ${d.description}` : ""}
                      </p>
                    ))}
                    {enc.prescription?.items?.map((item) => (
                      <p
                        key={item.id}
                        style={{ fontSize: 13, color: "var(--text-primary)" }}
                      >
                        {item.drug}
                        {item.dosage ? ` — ${item.dosage}` : ""}
                      </p>
                    ))}
                  </div>
                ))
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function NewAppointmentModal({
  clinicId,
  doctorOptions,
  initialPatient,
  onClose,
  onCreated,
}) {
  const { t } = useTranslation();
  const [mode, setMode] = useState("scheduled"); // "scheduled" | "walk-in"

  const [patientQuery, setPatientQuery] = useState(initialPatient?.name || "");
  const [patientResults, setPatientResults] = useState([]);
  const [patientSearching, setPatientSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(
    initialPatient || null,
  );

  const [doctorId, setDoctorId] = useState(doctorOptions[0]?.id || "");
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState(null);

  const [encounterType, setEncounterType] = useState("in_person");
  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (patientQuery.trim().length < 2) {
      setPatientResults([]);
      return;
    }
    setPatientSearching(true);
    const handle = setTimeout(() => {
      searchPatients(patientQuery.trim())
        .then(setPatientResults)
        .catch(() => setPatientResults([]))
        .finally(() => setPatientSearching(false));
    }, 300);
    return () => clearTimeout(handle);
  }, [patientQuery]);

  useEffect(() => {
    if (mode !== "scheduled" || !doctorId) return;
    setSlotsLoading(true);
    setSelectedSlotId(null);
    getDoctorAvailability(doctorId, { clinic_id: clinicId })
      .then(setSlots)
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [mode, doctorId, clinicId]);

  function selectPatient(p) {
    setSelectedPatient(p);
    setPatientQuery(p.name);
    setPatientResults([]);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selectedPatient) {
      setError("Search for and select a patient first.");
      return;
    }
    if (!doctorId) {
      setError("Select a doctor.");
      return;
    }
    if (mode === "scheduled" && !selectedSlotId) {
      setError("Select an available time slot.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const appointment =
        mode === "scheduled"
          ? await receptionistBookAppointment({
              patient_id: selectedPatient.id,
              slot_id: selectedSlotId,
              encounter_type: encounterType,
              notes: notes || undefined,
            })
          : await createWalkIn({
              patient_id: selectedPatient.id,
              doctor_id: doctorId,
              encounter_type: encounterType,
              notes: notes || undefined,
            });
      onCreated(appointment);
    } catch (err) {
      setError(
        err.errors
          ? Object.values(err.errors)[0][0]
          : err.message || "Couldn't create appointment.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal">
        <div className="modal-header">
          <div>
            <h2>{t("appointments.newAppointmentTitle")}</h2>
            <p>{t("appointments.newAppointmentDesc")}</p>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <i className="ti ti-x" aria-hidden="true" />
          </button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="modal-left">
              <div className="modal-search">
                <i className="ti ti-search" aria-hidden="true" />
                <input
                  type="text"
                  placeholder={t("appointments.searchPatientPlaceholder")}
                  value={patientQuery}
                  onChange={(e) => {
                    setPatientQuery(e.target.value);
                    setSelectedPatient(null);
                  }}
                />
              </div>
              {patientSearching && (
                <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
                  {t("appointments.searching")}
                </p>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {patientResults.map((p) => (
                  <div
                    key={p.id}
                    className={`patient-result${selectedPatient?.id === p.id ? " selected" : ""}`}
                    onClick={() => selectPatient(p)}
                  >
                    <div className="patient-cell">
                      <div className="patient-avatar">{initialsOf(p.name)}</div>
                      <div>
                        <div className="patient-name">{p.name}</div>
                        <div className="patient-id">
                          {p.phone}
                          {p.id_card_number ? ` • ${p.id_card_number}` : ""}
                        </div>
                      </div>
                    </div>
                    {selectedPatient?.id === p.id && (
                      <i
                        className="ti ti-circle-check"
                        aria-hidden="true"
                        style={{ color: "var(--green)" }}
                      />
                    )}
                  </div>
                ))}
                {!patientSearching &&
                  patientQuery.trim().length >= 2 &&
                  patientResults.length === 0 && (
                    <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
                      {t("appointments.noPatientsFound")}
                    </p>
                  )}
              </div>
            </div>

            <div className="modal-right">
              <div className="modal-toggle">
                <button
                  type="button"
                  className={`modal-toggle-btn${mode === "scheduled" ? " active" : ""}`}
                  onClick={() => setMode("scheduled")}
                >
                  {t("appointments.scheduled")}
                </button>
                <button
                  type="button"
                  className={`modal-toggle-btn${mode === "walk-in" ? " active" : ""}`}
                  onClick={() => setMode("walk-in")}
                >
                  {t("appointments.walkInMode")}
                </button>
              </div>

              <div className="modal-field">
                <label className="modal-label">{t("appointments.doctorLabel")}</label>
                <select
                  className="modal-select"
                  value={doctorId}
                  onChange={(e) => setDoctorId(Number(e.target.value))}
                >
                  {doctorOptions.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-field">
                <label className="modal-label">{t("appointments.consultationType")}</label>
                <select
                  className="modal-select"
                  value={encounterType}
                  onChange={(e) => setEncounterType(e.target.value)}
                >
                  <option value="in_person">{t("appointments.inPerson")}</option>
                  <option value="chat">{t("appointments.chat")}</option>
                </select>
              </div>

              {mode === "scheduled" && (
                <div className="modal-field">
                  <span className="modal-label">{t("appointments.availableTimes")}</span>
                  {slotsLoading ? (
                    <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
                      {t("appointments.loadingSlots")}
                    </p>
                  ) : slots.length === 0 ? (
                    <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
                      {t("appointments.noSlots")}
                    </p>
                  ) : (
                    <div className="time-slots">
                      {slots.map((s) => {
                        const d = new Date(s.starts_at);
                        const label = Number.isNaN(d.getTime())
                          ? s.starts_at
                          : d.toLocaleString(undefined, {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            });
                        return (
                          <button
                            type="button"
                            key={s.id}
                            className={`time-slot${selectedSlotId === s.id ? " selected" : ""}`}
                            onClick={() => setSelectedSlotId(s.id)}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <div className="modal-field">
                <label className="modal-label">{t("appointments.notesOptional")}</label>
                <textarea
                  className="modal-input"
                  rows={3}
                  maxLength={1000}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {error && (
                <div style={{ fontSize: 12, color: "var(--red)" }}>{error}</div>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-outline" onClick={onClose}>
              {t("doctorProfile.cancel")}
            </button>
            <button type="submit" className="btn-dark" disabled={saving}>
              {saving
                ? "Saving…"
                : mode === "scheduled"
                  ? t("appointments.confirmBooking")
                  : t("appointments.createWalkIn")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AppointmentsPage() {
  const { user } = useAuth();
  const role = user?.role; // "doctor" | "receptionist"
  const { selectedClinicId, clinics } = useClinic();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const STATUS_META = statusMeta(t);
  const FILTER_TABS = filterTabs(t);
  const ENCOUNTER_LABELS = encounterLabels(t);

  const [status, setStatus] = useState("");
  const [date, setDate] = useState("");
  const [doctorFilter, setDoctorFilter] = useState("");
  const [page, setPage] = useState(1);

  const [doctorOptions, setDoctorOptions] = useState([]);

  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [actingId, setActingId] = useState(null);
  const [actionError, setActionError] = useState("");
  const [actionNotice, setActionNotice] = useState("");

  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelSaving, setCancelSaving] = useState(false);
  const [cancelError, setCancelError] = useState("");

  const [showNewAppointment, setShowNewAppointment] = useState(false);
  const [patientProfileId, setPatientProfileId] = useState(null);
  const [prefillPatient, setPrefillPatient] = useState(null);

  // Arrived here from PatientsPage's "Book Appointment" button (with a
  // patient pre-selected) or from the Reception dashboard's quick actions
  // (blank booking modal, or a preset status filter) — apply whichever
  // was sent, then clear the router state so a refresh/back doesn't
  // reopen/reapply it.
  useEffect(() => {
    if (location.state?.prefillPatient) {
      setPrefillPatient(location.state.prefillPatient);
      setShowNewAppointment(true);
      navigate(location.pathname, { replace: true, state: {} });
    } else if (location.state?.openBooking) {
      setShowNewAppointment(true);
      navigate(location.pathname, { replace: true, state: {} });
    } else if (location.state?.initialStatus) {
      setStatus(location.state.initialStatus);
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Doctor picker options, receptionist only — reuses the same public
  // search endpoint the Schedule page's doctor switcher uses.
  useEffect(() => {
    if (role === "receptionist") {
      const clinicId = user?.profile?.clinic?.[0]?.clinic_id;
      if (clinicId) {
        searchDoctorsByClinic(clinicId)
          .then(setDoctorOptions)
          .catch(() => setDoctorOptions([]));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  function load() {
    if (!role) return;
    setLoading(true);
    setLoadError("");
    const params = { page };
    if (status) params.status = status;
    if (date) params.date = date;
    if (role === "receptionist" && doctorFilter) {
      params.doctor_id = doctorFilter;
    }

    const fetcher =
      role === "doctor" ? getDoctorAppointments : getReceptionistAppointments;
    fetcher(params)
      .then((result) => {
        // The doctor appointments endpoint has no clinic_id filter — it
        // always returns every clinic's appointments together. Filter to
        // the selected clinic client-side. Note this means the pager
        // below ("Page X of Y") still reflects the full unfiltered count
        // from the backend, not just this clinic — a real limitation for
        // a doctor working at more than one clinic, not a bug here.
        const scoped =
          role === "doctor" && selectedClinicId
            ? result.items.filter((a) => a.clinic?.id === selectedClinicId)
            : result.items;
        setItems(scoped);
        setMeta(result.meta);
      })
      .catch((err) =>
        setLoadError(err.message || "Couldn't load appointments."),
      )
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, status, date, doctorFilter, page, selectedClinicId]);

  function replaceItem(updated) {
    setItems((list) => list.map((a) => (a.id === updated.id ? updated : a)));
  }

  function changeFilter(setter, value) {
    setter(value);
    setPage(1);
  }

  async function runAction(id, actionFn, successMessage) {
    setActingId(id);
    setActionError("");
    setActionNotice("");
    try {
      const updated = await actionFn(id);
      replaceItem(updated);
      setActionNotice(successMessage);
    } catch (err) {
      setActionError(err.message || "Couldn't update appointment.");
    } finally {
      setActingId(null);
    }
  }

  const handleStart = (id) =>
    runAction(id, startAppointment, "Consultation started.");
  const handleComplete = (id) =>
    runAction(id, completeAppointment, "Appointment marked as completed.");
  const handleCheckIn = (id) =>
    runAction(id, checkInAppointment, "Patient checked in.");
  const handleNoShow = (id) =>
    runAction(
      id,
      role === "doctor" ? markDoctorNoShow : markReceptionistNoShow,
      "Marked as no-show.",
    );

  function openCancel(id) {
    setCancelTarget(id);
    setCancelReason("");
    setCancelError("");
  }

  async function submitCancel(e) {
    e.preventDefault();
    if (!cancelReason.trim()) {
      setCancelError("Please enter a cancellation reason.");
      return;
    }
    setCancelSaving(true);
    setCancelError("");
    try {
      const fn =
        role === "doctor"
          ? cancelDoctorAppointment
          : cancelReceptionistAppointment;
      const updated = await fn(cancelTarget, cancelReason.trim());
      replaceItem(updated);
      setCancelTarget(null);
      setActionNotice("Appointment cancelled.");
    } catch (err) {
      setCancelError(
        err.errors
          ? Object.values(err.errors)[0][0]
          : err.message || "Couldn't cancel appointment.",
      );
    } finally {
      setCancelSaving(false);
    }
  }

  if (!role || (role !== "doctor" && role !== "receptionist")) return null;

  const columnCount = role === "receptionist" ? 7 : 6;

  return (
    <div className="layout-shell">
      <Sidebar />
      <div className="layout-main">
        <Topbar searchPlaceholder={t("topbar.searchDefault")} />
        <main className="page-content">
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
                {t("appointments.title")}
              </h1>
            </div>
            <div className="page-toolbar-right">
              {role === "receptionist" && (
                <select
                  className="toolbar-select"
                  value={doctorFilter}
                  onChange={(e) =>
                    changeFilter(setDoctorFilter, e.target.value)
                  }
                >
                  <option value="">{t("appointments.allDoctors")}</option>
                  {doctorOptions.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              )}
              <input
                type="date"
                className="toolbar-select"
                value={date}
                onChange={(e) => changeFilter(setDate, e.target.value)}
              />
              {role === "receptionist" && (
                <button
                  className="btn-dark"
                  onClick={() => setShowNewAppointment(true)}
                  disabled={doctorOptions.length === 0}
                >
                  <i className="ti ti-plus" aria-hidden="true" />
                  {t("appointments.newAppointment")}
                </button>
              )}
            </div>
          </div>

          <div className="filter-tabs">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.value || "all"}
                className={`filter-tab${status === tab.value ? " active" : ""}`}
                onClick={() => changeFilter(setStatus, tab.value)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {loadError && (
            <div className="apt-banner apt-banner-error">{loadError}</div>
          )}
          {role === "doctor" && clinics.length > 1 && (
            <div className="apt-banner apt-banner-info">
              Rows are filtered to your selected clinic, but the page count
              below still reflects appointments across all your clinics —
              there's no way to filter that server-side yet.
            </div>
          )}
          {actionNotice && (
            <div className="apt-banner apt-banner-success">{actionNotice}</div>
          )}
          {actionError && (
            <div className="apt-banner apt-banner-error">{actionError}</div>
          )}

          <div className="card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t("appointments.patient")}</th>
                  {role === "receptionist" && <th>{t("appointments.doctor")}</th>}
                  <th>{t("appointments.dateTime")}</th>
                  <th>{t("appointments.type")}</th>
                  <th>{t("appointments.price")}</th>
                  <th>{t("appointments.status")}</th>
                  <th style={{ textAlign: "right" }}>{t("appointments.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((apt) => {
                  const slot = formatSlot(apt.slot);
                  const statusMetaRow = STATUS_META[apt.status] || {
                    label: apt.status,
                    badge: apt.status,
                  };
                  const actions = availableActions(role, apt.status);
                  return (
                    <tr key={apt.id}>
                      <td>
                        <div
                          className="patient-cell"
                          style={
                            role === "doctor" && apt.patient?.id
                              ? { cursor: "pointer" }
                              : undefined
                          }
                          onClick={() =>
                            role === "doctor" &&
                            apt.patient?.id &&
                            setPatientProfileId(apt.patient.id)
                          }
                        >
                          <div className="patient-avatar">
                            {initialsOf(apt.patient?.name)}
                          </div>
                          <div>
                            <div className="patient-name">
                              {apt.patient?.name || "—"}
                            </div>
                            {apt.clinic?.name && (
                              <div className="patient-id">
                                {apt.clinic.name}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      {role === "receptionist" && (
                        <td
                          style={{
                            color: "var(--text-secondary)",
                            fontSize: 14,
                          }}
                        >
                          {apt.doctor?.name || "—"}
                        </td>
                      )}
                      <td>
                        {slot ? (
                          <>
                            <div style={{ fontSize: 14, fontWeight: 500 }}>
                              {slot.time}
                            </div>
                            <div
                              style={{
                                fontSize: 12,
                                color: "var(--text-muted)",
                              }}
                            >
                              {slot.date}
                            </div>
                          </>
                        ) : (
                          <span
                            style={{
                              fontSize: 13,
                              color: "var(--text-muted)",
                            }}
                          >
                            {t("appointments.walkIn")}
                          </span>
                        )}
                      </td>
                      <td
                        style={{ fontSize: 14, color: "var(--text-secondary)" }}
                      >
                        {ENCOUNTER_LABELS[apt.encounter_type] ||
                          apt.encounter_type}
                      </td>
                      <td
                        style={{ fontSize: 14, color: "var(--text-secondary)" }}
                      >
                        {apt.price != null
                          ? `$${Number(apt.price).toFixed(2)}`
                          : "—"}
                      </td>
                      <td>
                        <span className={`badge badge-${statusMetaRow.badge}`}>
                          {statusMetaRow.label}
                        </span>
                      </td>
                      <td>
                        <div className="action-cell">
                          {actions.includes("start") && (
                            <button
                              className="btn-dark"
                              disabled={actingId === apt.id}
                              onClick={() => handleStart(apt.id)}
                            >
                              {t("appointments.start")}
                            </button>
                          )}
                          {actions.includes("complete") && (
                            <button
                              className="btn-dark"
                              disabled={actingId === apt.id}
                              onClick={() => handleComplete(apt.id)}
                            >
                              {t("appointments.complete")}
                            </button>
                          )}
                          {actions.includes("check-in") && (
                            <button
                              className="btn-dark"
                              disabled={actingId === apt.id}
                              onClick={() => handleCheckIn(apt.id)}
                            >
                              {t("appointments.checkIn")}
                            </button>
                          )}
                          {actions.includes("no-show") && (
                            <button
                              className="btn-outline"
                              disabled={actingId === apt.id}
                              onClick={() => handleNoShow(apt.id)}
                            >
                              {t("appointments.noShow")}
                            </button>
                          )}
                          {actions.includes("cancel") && (
                            <button
                              className="btn-ghost"
                              disabled={actingId === apt.id}
                              onClick={() => openCancel(apt.id)}
                            >
                              {t("appointments.cancel")}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!loading && items.length === 0 && (
                  <tr>
                    <td
                      colSpan={columnCount}
                      style={{
                        textAlign: "center",
                        padding: 24,
                        color: "var(--text-muted)",
                      }}
                    >
                      {t("appointments.noAppointments")}
                    </td>
                  </tr>
                )}
                {loading && (
                  <tr>
                    <td
                      colSpan={columnCount}
                      style={{
                        textAlign: "center",
                        padding: 24,
                        color: "var(--text-muted)",
                      }}
                    >
                      {t("appointments.loading")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {meta && meta.total > 0 && (
              <div className="table-footer">
                <span>
                  Showing {meta.from} to {meta.to} of {meta.total} entries
                </span>
                <div className="pagination">
                  <button
                    className="page-btn"
                    disabled={meta.current_page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    aria-label="Previous page"
                  >
                    <i className="ti ti-chevron-left" />
                  </button>
                  <span
                    style={{
                      padding: "0 10px",
                      fontSize: 13,
                      color: "var(--text-secondary)",
                    }}
                  >
                    {t("appointments.page")} {meta.current_page} {t("appointments.of")} {meta.last_page}
                  </span>
                  <button
                    className="page-btn"
                    disabled={meta.current_page >= meta.last_page}
                    onClick={() => setPage((p) => p + 1)}
                    aria-label="Next page"
                  >
                    <i className="ti ti-chevron-right" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {cancelTarget && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setCancelTarget(null)}
        >
          <div className="modal" style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <div>
                <h2>{t("appointments.cancelAppointmentTitle")}</h2>
                <p>{t("appointments.cancelAppointmentDesc")}</p>
              </div>
              <button
                className="modal-close"
                onClick={() => setCancelTarget(null)}
                aria-label="Close"
              >
                <i className="ti ti-x" aria-hidden="true" />
              </button>
            </div>
            <form className="modal-form" onSubmit={submitCancel}>
              <div
                className="modal-body"
                style={{ display: "block", padding: "20px 28px" }}
              >
                <div className="modal-field">
                  <label className="modal-label">{t("appointments.reason")}</label>
                  <textarea
                    className="modal-input"
                    rows={3}
                    maxLength={500}
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    autoFocus
                  />
                </div>
                {cancelError && (
                  <div style={{ fontSize: 12, color: "var(--red)" }}>
                    {cancelError}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => setCancelTarget(null)}
                  disabled={cancelSaving}
                >
                  {t("appointments.neverMind")}
                </button>
                <button
                  type="submit"
                  className="btn-dark"
                  disabled={cancelSaving}
                >
                  {cancelSaving ? t("appointments.cancelling") : t("appointments.cancelAppointment")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showNewAppointment && (
        <NewAppointmentModal
          clinicId={user?.profile?.clinic?.[0]?.clinic_id}
          doctorOptions={doctorOptions}
          initialPatient={prefillPatient}
          onClose={() => {
            setShowNewAppointment(false);
            setPrefillPatient(null);
          }}
          onCreated={() => {
            setShowNewAppointment(false);
            setPrefillPatient(null);
            setActionNotice("Appointment created.");
            load();
          }}
        />
      )}

      {patientProfileId && (
        <PatientProfileModal
          patientId={patientProfileId}
          onClose={() => setPatientProfileId(null)}
        />
      )}
    </div>
  );
}
