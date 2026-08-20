import { useState, useEffect, useMemo } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { useAuth } from "../context/AuthContext";
import { useClinic } from "../context/ClinicContext";
import "./styles/Layout.css";
import "./styles/Schedule.css";
import {
  getSchedule,
  setWeeklySchedule,
  activateVacation,
  deactivateVacation,
  generateSlots,
  listBlockedTimes,
  createBlockedTime,
  deleteBlockedTime,
  receptionistGetSchedule,
  receptionistSetWeeklySchedule,
  receptionistGenerateSlots,
  receptionistListBlockedTimes,
  receptionistCreateBlockedTime,
  receptionistDeleteBlockedTime,
  searchDoctorsByClinic,
} from "../api/Schedule";

// day_of_week follows the backend's Carbon convention: 0=Sunday..6=Saturday.
const DAY_LABELS = {
  0: "Sunday",
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
};
// Displayed Monday-first, Sunday last, matching the mockup.
const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const WEEKDAY_IDS = [1, 2, 3, 4, 5]; // Mon-Fri, for "Apply to all weekdays"

const SESSION_DEFS = [
  { key: "morning", label: "Morning", defaults: ["08:00", "12:00"] },
  { key: "afternoon", label: "Afternoon", defaults: ["14:00", "18:00"] },
  { key: "evening", label: "Evening", defaults: ["18:00", "21:00"] },
];

function emptyDay(dow) {
  const sessions = {};
  SESSION_DEFS.forEach(({ key, defaults }) => {
    sessions[key] = {
      active: false,
      start_time: defaults[0],
      end_time: defaults[1],
    };
  });
  return { day_of_week: dow, active: false, sessions };
}

function emptyWeek() {
  return Object.keys(DAY_LABELS).map((d) => emptyDay(Number(d)));
}

function emptyForm() {
  return {
    days: emptyWeek(),
    consultation_duration: 30,
    break_duration: 10,
    buffer_enabled: false,
    max_patients: "",
  };
}

// Backend ScheduleConfigResource -> frontend editable form shape.
function configToForm(config) {
  const days = emptyWeek();
  (config.days || []).forEach((day) => {
    const target = days.find((d) => d.day_of_week === day.day_of_week);
    if (!target) return;
    target.active = true;
    (day.sessions || []).forEach((s) => {
      const known = SESSION_DEFS.find((d) => d.key === s.session_type);
      const key = known ? known.key : null;
      if (key) {
        target.sessions[key] = {
          active: true,
          start_time: (s.start_time || "").slice(0, 5),
          end_time: (s.end_time || "").slice(0, 5),
        };
      }
    });
  });
  return {
    days,
    consultation_duration: config.consultation_duration ?? 30,
    break_duration: config.break_duration ?? 10,
    buffer_enabled: !!config.buffer_enabled,
    max_patients: config.max_patients ?? "",
  };
}

// Frontend form -> PUT payload for SetWeeklyScheduleRequest.
function formToPayload(form) {
  const days = form.days
    .filter((d) => d.active)
    .map((d) => ({
      day_of_week: d.day_of_week,
      sessions: SESSION_DEFS.filter(({ key }) => d.sessions[key].active).map(
        ({ key }) => ({
          session_type: key,
          start_time: d.sessions[key].start_time,
          end_time: d.sessions[key].end_time,
        }),
      ),
    }))
    .filter((d) => d.sessions.length > 0);

  return {
    consultation_duration: Number(form.consultation_duration),
    break_duration: Number(form.break_duration) || 0,
    buffer_enabled: !!form.buffer_enabled,
    max_patients: form.max_patients === "" ? null : Number(form.max_patients),
    days,
  };
}

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}
function toHHMM(mins) {
  const h = Math.floor(mins / 60)
    .toString()
    .padStart(2, "0");
  const m = (mins % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

// Live, client-side-only preview of what SlotGeneratorService would
// produce from the current unsaved form — same stepping logic (step =
// consultation_duration + buffer break), just never hits the API.
// Uses the first active day found as the representative day.
function previewSlots(form) {
  const duration = Number(form.consultation_duration) || 0;
  const step =
    duration + (form.buffer_enabled ? Number(form.break_duration) || 0 : 0);

  const bySession = { morning: [], afternoon: [], evening: [] };
  const sampleDay = form.days.find((d) => d.active);
  if (!sampleDay || !duration || !step) {
    return { bySession, dayTotal: 0, weeklyTotal: 0 };
  }

  SESSION_DEFS.forEach(({ key }) => {
    const session = sampleDay.sessions[key];
    if (!session.active || !session.start_time || !session.end_time) return;
    const start = toMinutes(session.start_time);
    const end = toMinutes(session.end_time);
    let cursor = start;
    while (cursor + duration <= end) {
      bySession[key].push(toHHMM(cursor));
      cursor += step;
    }
  });

  const dayTotal = Object.values(bySession).reduce((s, a) => s + a.length, 0);
  const activeDayCount = form.days.filter((d) => d.active).length;
  return { bySession, dayTotal, weeklyTotal: dayTotal * activeDayCount };
}

export default function SchedulePage() {
  const { user } = useAuth();
  const role = user?.role; // "doctor" | "receptionist"

  // ── Doctor context: which clinic — now shared globally via the Topbar
  // selector instead of a page-local dropdown, so it stays in sync with
  // every other page.
  const { clinics: doctorClinics, selectedClinicId: clinicId } = useClinic();

  // ── Receptionist context: pick which doctor at their one clinic ──
  const receptionistClinicId = user?.profile?.clinic?.[0]?.clinic_id || null;
  const [doctorOptions, setDoctorOptions] = useState([]);
  const [doctorId, setDoctorId] = useState(null);
  const [doctorPickerLoading, setDoctorPickerLoading] = useState(false);
  const [doctorPickerError, setDoctorPickerError] = useState("");

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [configMeta, setConfigMeta] = useState(null); // last-loaded/saved ScheduleConfig, or null if none yet
  const [form, setForm] = useState(emptyForm());
  const [dirty, setDirty] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveNotice, setSaveNotice] = useState("");

  const [blockedTimes, setBlockedTimes] = useState([]);

  const [showBlockPanel, setShowBlockPanel] = useState(false);
  const [blockForm, setBlockForm] = useState({
    mode: "recurring", // "recurring" (day_of_week) | "date" (block_date)
    block_date: "",
    day_of_week: 1,
    start_time: "",
    end_time: "",
    reason: "",
  });
  const [blockSaving, setBlockSaving] = useState(false);
  const [blockError, setBlockError] = useState("");

  const [showVacationPanel, setShowVacationPanel] = useState(false);
  const [vacationForm, setVacationForm] = useState({
    start_date: "",
    end_date: "",
  });
  const [vacationSaving, setVacationSaving] = useState(false);
  const [vacationError, setVacationError] = useState("");

  const [showGeneratePanel, setShowGeneratePanel] = useState(false);
  const [generateForm, setGenerateForm] = useState({
    date_from: "",
    date_to: "",
  });
  const [generateSaving, setGenerateSaving] = useState(false);
  const [generateError, setGenerateError] = useState("");

  // ── Establish role-based context on mount ──
  useEffect(() => {
    if (role === "doctor") {
      if (!doctorClinics.length) {
        setLoading(false);
        setLoadError(
          "You're not linked to any clinic yet — join or create one from your profile page first.",
        );
      }
    } else if (role === "receptionist") {
      if (!receptionistClinicId) {
        setLoading(false);
        setLoadError("Your account isn't linked to a clinic yet.");
        return;
      }
      setDoctorPickerLoading(true);
      searchDoctorsByClinic(receptionistClinicId)
        .then((docs) => {
          setDoctorOptions(docs);
          if (docs.length) {
            setDoctorId(docs[0].id);
          } else {
            setLoading(false);
            setLoadError(
              "No doctors with an active schedule found at your clinic yet.",
            );
          }
        })
        .catch((err) =>
          setDoctorPickerError(err.message || "Couldn't load doctors."),
        )
        .finally(() => setDoctorPickerLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  // ── Load the schedule + blocked times whenever the selected clinic/doctor changes ──
  useEffect(() => {
    if (role === "doctor" && clinicId) {
      loadDoctorSchedule(clinicId);
    } else if (role === "receptionist" && doctorId) {
      loadReceptionistSchedule(doctorId);
    }
  }, [role, clinicId, doctorId]);

  function loadDoctorSchedule(cid) {
    setLoading(true);
    setLoadError("");
    setSaveError("");
    setSaveNotice("");
    getSchedule(cid)
      .then((config) => {
        setConfigMeta(config);
        setForm(configToForm(config));
        setDirty(false);
      })
      .catch((err) => {
        if (err.status === 404) {
          // Not an error — this clinic just doesn't have a schedule configured yet.
          setConfigMeta(null);
          setForm(emptyForm());
          setDirty(false);
        } else {
          setLoadError(err.message || "Couldn't load schedule.");
        }
      })
      .finally(() => setLoading(false));

    listBlockedTimes(cid)
      .then(setBlockedTimes)
      .catch(() => setBlockedTimes([]));
  }

  function loadReceptionistSchedule(did) {
    setLoading(true);
    setLoadError("");
    setSaveError("");
    setSaveNotice("");
    receptionistGetSchedule(did)
      .then((config) => {
        setConfigMeta(config);
        setForm(configToForm(config));
        setDirty(false);
      })
      .catch((err) => {
        if (err.status === 404) {
          // Not an error — this doctor just doesn't have a schedule configured yet.
          setConfigMeta(null);
          setForm(emptyForm());
          setDirty(false);
        } else {
          setLoadError(err.message || "Couldn't load schedule.");
        }
      })
      .finally(() => setLoading(false));

    receptionistListBlockedTimes(did)
      .then(setBlockedTimes)
      .catch(() => setBlockedTimes([]));
  }

  function refetchCurrent() {
    if (role === "doctor" && clinicId) loadDoctorSchedule(clinicId);
    else if (role === "receptionist" && doctorId)
      loadReceptionistSchedule(doctorId);
  }

  // ── Form mutation helpers ──
  function toggleDay(dow) {
    setForm((f) => ({
      ...f,
      days: f.days.map((d) =>
        d.day_of_week === dow ? { ...d, active: !d.active } : d,
      ),
    }));
    setDirty(true);
  }

  function removeDay(dow) {
    setForm((f) => ({
      ...f,
      days: f.days.map((d) => (d.day_of_week === dow ? emptyDay(dow) : d)),
    }));
    setDirty(true);
  }

  function toggleSession(dow, key) {
    setForm((f) => ({
      ...f,
      days: f.days.map((d) =>
        d.day_of_week === dow
          ? {
              ...d,
              sessions: {
                ...d.sessions,
                [key]: { ...d.sessions[key], active: !d.sessions[key].active },
              },
            }
          : d,
      ),
    }));
    setDirty(true);
  }

  function updateSessionTime(dow, key, field, value) {
    setForm((f) => ({
      ...f,
      days: f.days.map((d) =>
        d.day_of_week === dow
          ? {
              ...d,
              sessions: {
                ...d.sessions,
                [key]: { ...d.sessions[key], [field]: value },
              },
            }
          : d,
      ),
    }));
    setDirty(true);
  }

  function applyToWeekdays() {
    setForm((f) => {
      const monday = f.days.find((d) => d.day_of_week === 1);
      return {
        ...f,
        days: f.days.map((d) =>
          WEEKDAY_IDS.includes(d.day_of_week) && d.day_of_week !== 1
            ? {
                ...d,
                active: monday.active,
                sessions: JSON.parse(JSON.stringify(monday.sessions)),
              }
            : d,
        ),
      };
    });
    setDirty(true);
  }

  function updateSetting(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setDirty(true);
  }

  // ── Save / discard ──
  async function handleSave() {
    const payload = formToPayload(form);
    if (payload.days.length === 0) {
      setSaveError(
        "Turn on at least one day with at least one session before saving.",
      );
      return;
    }
    setSaving(true);
    setSaveError("");
    setSaveNotice("");
    try {
      if (role === "doctor") {
        const updated = await setWeeklySchedule(clinicId, payload);
        setConfigMeta(updated);
        setForm(configToForm(updated));
      } else {
        await receptionistSetWeeklySchedule(doctorId, payload);
        const refreshed = await receptionistGetSchedule(doctorId);
        setConfigMeta(refreshed);
        setForm(configToForm(refreshed));
      }
      setDirty(false);
      setSaveNotice("Schedule saved.");
    } catch (err) {
      setSaveError(
        err.errors
          ? Object.values(err.errors).flat().join(" ")
          : err.message || "Couldn't save schedule.",
      );
    } finally {
      setSaving(false);
    }
  }

  function handleDiscard() {
    refetchCurrent();
  }

  // ── Vacation mode (doctor only) ──
  async function handleActivateVacation(e) {
    e.preventDefault();
    setVacationSaving(true);
    setVacationError("");
    try {
      const result = await activateVacation(clinicId, vacationForm);
      setConfigMeta((m) => ({ ...m, ...result.schedule }));
      setShowVacationPanel(false);
      setVacationForm({ start_date: "", end_date: "" });
      setSaveNotice(
        result.affected_bookings > 0
          ? `Vacation activated. ${result.affected_bookings} existing booking(s) overlap and need manual attention.`
          : "Vacation mode activated.",
      );
    } catch (err) {
      setVacationError(
        err.errors
          ? Object.values(err.errors)[0][0]
          : err.message || "Couldn't activate vacation.",
      );
    } finally {
      setVacationSaving(false);
    }
  }

  async function handleDeactivateVacation() {
    setVacationSaving(true);
    setVacationError("");
    try {
      const updated = await deactivateVacation(clinicId);
      setConfigMeta((m) => ({ ...m, ...updated }));
    } catch (err) {
      setVacationError(err.message || "Couldn't deactivate vacation.");
    } finally {
      setVacationSaving(false);
    }
  }

  // ── Blocked times ──
  async function handleCreateBlockedTime(e) {
    e.preventDefault();
    setBlockSaving(true);
    setBlockError("");
    try {
      const payload = {
        start_time: blockForm.start_time,
        end_time: blockForm.end_time,
        reason: blockForm.reason || undefined,
      };
      if (blockForm.mode === "date") payload.block_date = blockForm.block_date;
      else payload.day_of_week = Number(blockForm.day_of_week);

      const result =
        role === "doctor"
          ? await createBlockedTime(clinicId, payload)
          : await receptionistCreateBlockedTime(doctorId, payload);

      setBlockedTimes((list) => [result.blocked_time, ...list]);
      setShowBlockPanel(false);
      setBlockForm({
        mode: "recurring",
        block_date: "",
        day_of_week: 1,
        start_time: "",
        end_time: "",
        reason: "",
      });
      setSaveNotice(
        result.affected_bookings > 0
          ? `Time blocked. Warning: ${result.affected_bookings} existing booking(s) overlap and need manual attention.`
          : "Time blocked.",
      );
    } catch (err) {
      setBlockError(
        err.errors
          ? Object.values(err.errors)[0][0]
          : err.message || "Couldn't block this time.",
      );
    } finally {
      setBlockSaving(false);
    }
  }

  async function handleDeleteBlockedTime(id) {
    try {
      if (role === "doctor") await deleteBlockedTime(id);
      else await receptionistDeleteBlockedTime(id);
      setBlockedTimes((list) => list.filter((b) => b.id !== id));
    } catch (err) {
      setSaveError(err.message || "Couldn't remove blocked time.");
    }
  }

  // ── Generate slots ──
  async function handleGenerateSlots(e) {
    e.preventDefault();
    setGenerateSaving(true);
    setGenerateError("");
    try {
      const result =
        role === "doctor"
          ? await generateSlots(clinicId, generateForm)
          : await receptionistGenerateSlots(doctorId, generateForm);
      setSaveNotice(result.message || "Time slots generated successfully.");
      setShowGeneratePanel(false);
      setGenerateForm({ date_from: "", date_to: "" });
    } catch (err) {
      setGenerateError(
        err.errors
          ? Object.values(err.errors)[0][0]
          : err.message || "Couldn't generate slots.",
      );
    } finally {
      setGenerateSaving(false);
    }
  }

  const preview = useMemo(() => previewSlots(form), [form]);
  const isOnVacation = !!configMeta?.is_on_vacation;

  if (!role || (role !== "doctor" && role !== "receptionist")) {
    return null;
  }

  return (
    <div className="layout-shell">
      <Sidebar />
      <div className="layout-main">
        <Topbar searchPlaceholder="Search..." />
        <main className="page-content">
          <div className="page-header">
            <div className="page-header-left">
              <h1>Schedule Management</h1>
              <p>
                Configure weekly consultation availability and slot generation
                rules.
              </p>
            </div>

            {role === "receptionist" && (
              <div className="sch-context-switcher">
                <span className="sch-context-badge">Receptionist View</span>
                <div className="sch-field">
                  <label className="sch-label">Managing schedule for</label>
                  <select
                    className="sch-input"
                    value={doctorId || ""}
                    disabled={doctorPickerLoading || !doctorOptions.length}
                    onChange={(e) => setDoctorId(Number(e.target.value))}
                  >
                    {doctorOptions.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {doctorPickerError && (
            <div className="sch-banner sch-banner-error">
              {doctorPickerError}
            </div>
          )}
          {loadError && (
            <div className="sch-banner sch-banner-error">{loadError}</div>
          )}
          {saveNotice && (
            <div className="sch-banner sch-banner-success">{saveNotice}</div>
          )}
          {saveError && (
            <div className="sch-banner sch-banner-error">{saveError}</div>
          )}

          {role === "receptionist" && !loadError && (
            <div className="sch-banner sch-banner-info">
              This form is pre-filled from the doctor's current schedule. Saving
              replaces their full weekly schedule with whatever's shown below,
              so double-check before saving.
            </div>
          )}

          {!loading && !loadError && (clinicId || doctorId) && (
            <>
              <div className="sch-actions-bar">
                <button
                  className="btn-outline"
                  onClick={handleDiscard}
                  disabled={saving || !dirty}
                >
                  Discard Changes
                </button>
                <button
                  className="btn-dark"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? "Saving…" : "Save Schedule"}
                </button>
              </div>

              <div className="two-col">
                {/* ── Left column ── */}
                <div>
                  <div className="card sch-week-card">
                    <div className="card-header">
                      <h2 className="card-title">
                        <i className="ti ti-calendar-week" aria-hidden="true" />{" "}
                        Weekly Availability
                      </h2>
                      <div className="sch-week-header-actions">
                        <button className="btn-ghost" onClick={applyToWeekdays}>
                          <i className="ti ti-copy" aria-hidden="true" /> Apply
                          to all weekdays
                        </button>
                        {role === "doctor" && (
                          <div className="sch-vacation-toggle">
                            <span
                              className={isOnVacation ? "sch-vacation-on" : ""}
                            >
                              Vacation Mode
                              {!isOnVacation && showVacationPanel && (
                                <em className="sch-vacation-pending">
                                  {" "}
                                  — pick dates below
                                </em>
                              )}
                            </span>
                            <button
                              type="button"
                              className={`sch-switch ${isOnVacation ? "on" : ""} ${
                                !isOnVacation && showVacationPanel
                                  ? "pending"
                                  : ""
                              }`}
                              onClick={() =>
                                isOnVacation
                                  ? handleDeactivateVacation()
                                  : setShowVacationPanel((v) => !v)
                              }
                              disabled={vacationSaving}
                              aria-label="Toggle vacation mode"
                            >
                              <span className="sch-switch-knob" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {role === "doctor" &&
                      showVacationPanel &&
                      !isOnVacation && (
                        <form
                          className="sch-inline-panel"
                          onSubmit={handleActivateVacation}
                        >
                          <div className="sch-field">
                            <label className="sch-label">Start date</label>
                            <input
                              type="date"
                              className="sch-input"
                              required
                              value={vacationForm.start_date}
                              onChange={(e) =>
                                setVacationForm((f) => ({
                                  ...f,
                                  start_date: e.target.value,
                                }))
                              }
                            />
                          </div>
                          <div className="sch-field">
                            <label className="sch-label">End date</label>
                            <input
                              type="date"
                              className="sch-input"
                              required
                              value={vacationForm.end_date}
                              onChange={(e) =>
                                setVacationForm((f) => ({
                                  ...f,
                                  end_date: e.target.value,
                                }))
                              }
                            />
                          </div>
                          {vacationError && (
                            <div className="sch-error-inline">
                              {vacationError}
                            </div>
                          )}
                          <div className="sch-inline-panel-actions">
                            <button
                              type="submit"
                              className="btn-dark"
                              disabled={vacationSaving}
                            >
                              {vacationSaving
                                ? "Activating…"
                                : "Activate vacation"}
                            </button>
                            <button
                              type="button"
                              className="btn-outline"
                              onClick={() => setShowVacationPanel(false)}
                              disabled={vacationSaving}
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      )}

                    {isOnVacation && (
                      <div
                        className="sch-banner sch-banner-info"
                        style={{ margin: "12px 22px 0" }}
                      >
                        On vacation {configMeta?.vacation_start_date} to{" "}
                        {configMeta?.vacation_end_date}. No slots will generate
                        for this period.
                      </div>
                    )}

                    <div className="sch-days">
                      {DISPLAY_ORDER.map((dow) => {
                        const day = form.days.find(
                          (d) => d.day_of_week === dow,
                        );
                        return (
                          <div className="sch-day-row" key={dow}>
                            <div className="sch-day-row-top">
                              <label className="sch-day-checkbox">
                                <input
                                  type="checkbox"
                                  checked={day.active}
                                  onChange={() => toggleDay(dow)}
                                />
                                <span>{DAY_LABELS[dow]}</span>
                              </label>
                              <button
                                type="button"
                                className="sch-icon-btn"
                                aria-label={`Clear ${DAY_LABELS[dow]}`}
                                onClick={() => removeDay(dow)}
                              >
                                <i className="ti ti-trash" aria-hidden="true" />
                              </button>
                            </div>

                            {day.active ? (
                              <div className="sch-sessions">
                                {SESSION_DEFS.map(({ key, label }) => {
                                  const session = day.sessions[key];
                                  return (
                                    <div className="sch-session" key={key}>
                                      <label className="sch-session-label">
                                        <input
                                          type="checkbox"
                                          checked={session.active}
                                          onChange={() =>
                                            toggleSession(dow, key)
                                          }
                                        />
                                        {label.toUpperCase()}
                                      </label>
                                      <div className="sch-time-range">
                                        <input
                                          type="time"
                                          className="sch-time-input"
                                          disabled={!session.active}
                                          value={session.start_time}
                                          onChange={(e) =>
                                            updateSessionTime(
                                              dow,
                                              key,
                                              "start_time",
                                              e.target.value,
                                            )
                                          }
                                        />
                                        <span>-</span>
                                        <input
                                          type="time"
                                          className="sch-time-input"
                                          disabled={!session.active}
                                          value={session.end_time}
                                          onChange={(e) =>
                                            updateSessionTime(
                                              dow,
                                              key,
                                              "end_time",
                                              e.target.value,
                                            )
                                          }
                                        />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="sch-day-closed">
                                Clinic closed - No slots generated
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="card sch-blocked-card">
                    <div className="card-header">
                      <h2 className="card-title">Blocked Times</h2>
                      <button
                        className="btn-outline"
                        onClick={() => setShowBlockPanel((v) => !v)}
                      >
                        <i className="ti ti-forbid-2" aria-hidden="true" />{" "}
                        Block Time
                      </button>
                    </div>

                    {showBlockPanel && (
                      <form
                        className="sch-inline-panel"
                        onSubmit={handleCreateBlockedTime}
                      >
                        <div className="sch-block-mode">
                          <label>
                            <input
                              type="radio"
                              checked={blockForm.mode === "recurring"}
                              onChange={() =>
                                setBlockForm((f) => ({
                                  ...f,
                                  mode: "recurring",
                                }))
                              }
                            />
                            Every week on a day
                          </label>
                          <label>
                            <input
                              type="radio"
                              checked={blockForm.mode === "date"}
                              onChange={() =>
                                setBlockForm((f) => ({ ...f, mode: "date" }))
                              }
                            />
                            One specific date
                          </label>
                        </div>

                        {blockForm.mode === "recurring" ? (
                          <div className="sch-field">
                            <label className="sch-label">Day</label>
                            <select
                              className="sch-input"
                              value={blockForm.day_of_week}
                              onChange={(e) =>
                                setBlockForm((f) => ({
                                  ...f,
                                  day_of_week: e.target.value,
                                }))
                              }
                            >
                              {DISPLAY_ORDER.map((dow) => (
                                <option key={dow} value={dow}>
                                  {DAY_LABELS[dow]}
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <div className="sch-field">
                            <label className="sch-label">Date</label>
                            <input
                              type="date"
                              className="sch-input"
                              required
                              value={blockForm.block_date}
                              onChange={(e) =>
                                setBlockForm((f) => ({
                                  ...f,
                                  block_date: e.target.value,
                                }))
                              }
                            />
                          </div>
                        )}

                        <div className="sch-grid-2">
                          <div className="sch-field">
                            <label className="sch-label">Start time</label>
                            <input
                              type="time"
                              className="sch-input"
                              required
                              value={blockForm.start_time}
                              onChange={(e) =>
                                setBlockForm((f) => ({
                                  ...f,
                                  start_time: e.target.value,
                                }))
                              }
                            />
                          </div>
                          <div className="sch-field">
                            <label className="sch-label">End time</label>
                            <input
                              type="time"
                              className="sch-input"
                              required
                              value={blockForm.end_time}
                              onChange={(e) =>
                                setBlockForm((f) => ({
                                  ...f,
                                  end_time: e.target.value,
                                }))
                              }
                            />
                          </div>
                        </div>

                        <div className="sch-field">
                          <label className="sch-label">Reason (optional)</label>
                          <input
                            type="text"
                            className="sch-input"
                            maxLength={255}
                            value={blockForm.reason}
                            onChange={(e) =>
                              setBlockForm((f) => ({
                                ...f,
                                reason: e.target.value,
                              }))
                            }
                          />
                        </div>

                        {blockError && (
                          <div className="sch-error-inline">{blockError}</div>
                        )}

                        <div className="sch-inline-panel-actions">
                          <button
                            type="submit"
                            className="btn-dark"
                            disabled={blockSaving}
                          >
                            {blockSaving ? "Blocking…" : "Block this time"}
                          </button>
                          <button
                            type="button"
                            className="btn-outline"
                            onClick={() => setShowBlockPanel(false)}
                            disabled={blockSaving}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}

                    {blockedTimes.length === 0 ? (
                      <p className="sch-note">No blocked times.</p>
                    ) : (
                      <ul className="sch-blocked-list">
                        {blockedTimes.map((b) => (
                          <li key={b.id}>
                            <div>
                              <strong>
                                {b.block_date || DAY_LABELS[b.day_of_week]}
                              </strong>{" "}
                              {b.start_time}–{b.end_time}
                              {b.reason && (
                                <span className="sch-blocked-reason">
                                  {" "}
                                  · {b.reason}
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              className="sch-icon-btn"
                              aria-label="Remove blocked time"
                              onClick={() => handleDeleteBlockedTime(b.id)}
                            >
                              <i className="ti ti-x" aria-hidden="true" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {/* ── Right column ── */}
                <div>
                  <div className="card sch-settings-card">
                    <div className="card-header">
                      <h2 className="card-title">
                        <i className="ti ti-adjustments" aria-hidden="true" />{" "}
                        Slot Settings
                      </h2>
                      <button
                        className="btn-outline"
                        onClick={() => setShowGeneratePanel((v) => !v)}
                      >
                        Generate Slots
                      </button>
                    </div>

                    {showGeneratePanel && (
                      <form
                        className="sch-inline-panel"
                        onSubmit={handleGenerateSlots}
                      >
                        <p className="sch-note" style={{ marginTop: 0 }}>
                          Turns the saved weekly template above into actual
                          bookable time slots for a date range (up to 90 days).
                          Save your schedule first if you've changed anything.
                        </p>
                        <div className="sch-field">
                          <label className="sch-label">From</label>
                          <input
                            type="date"
                            className="sch-input"
                            required
                            value={generateForm.date_from}
                            onChange={(e) =>
                              setGenerateForm((f) => ({
                                ...f,
                                date_from: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="sch-field">
                          <label className="sch-label">To</label>
                          <input
                            type="date"
                            className="sch-input"
                            required
                            value={generateForm.date_to}
                            onChange={(e) =>
                              setGenerateForm((f) => ({
                                ...f,
                                date_to: e.target.value,
                              }))
                            }
                          />
                        </div>
                        {generateError && (
                          <div className="sch-error-inline">
                            {generateError}
                          </div>
                        )}
                        <div className="sch-inline-panel-actions">
                          <button
                            type="submit"
                            className="btn-dark"
                            disabled={generateSaving}
                          >
                            {generateSaving ? "Generating…" : "Generate"}
                          </button>
                          <button
                            type="button"
                            className="btn-outline"
                            onClick={() => setShowGeneratePanel(false)}
                            disabled={generateSaving}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}

                    <div className="sch-settings-body">
                      <div className="sch-settings-label">
                        Consultation duration
                      </div>
                      <div className="sch-duration-presets">
                        {[15, 20, 30, 60].map((mins) => (
                          <button
                            type="button"
                            key={mins}
                            className={`sch-preset-btn ${
                              Number(form.consultation_duration) === mins
                                ? "active"
                                : ""
                            }`}
                            onClick={() =>
                              updateSetting("consultation_duration", mins)
                            }
                          >
                            {mins} min
                          </button>
                        ))}
                      </div>
                      <input
                        type="number"
                        min="5"
                        max="240"
                        className="sch-input"
                        style={{ marginTop: 8 }}
                        value={form.consultation_duration}
                        onChange={(e) =>
                          updateSetting("consultation_duration", e.target.value)
                        }
                      />

                      <div className="sch-grid-2" style={{ marginTop: 16 }}>
                        <div className="sch-field">
                          <label className="sch-label">
                            Break duration (min)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="120"
                            className="sch-input"
                            value={form.break_duration}
                            onChange={(e) =>
                              updateSetting("break_duration", e.target.value)
                            }
                          />
                        </div>
                        <div className="sch-field">
                          <label className="sch-label">Max patients</label>
                          <input
                            type="number"
                            min="1"
                            className="sch-input"
                            value={form.max_patients}
                            onChange={(e) =>
                              updateSetting("max_patients", e.target.value)
                            }
                          />
                        </div>
                      </div>

                      <label className="sch-buffer-toggle">
                        <span>Buffer between appointments</span>
                        <input
                          type="checkbox"
                          checked={form.buffer_enabled}
                          onChange={(e) =>
                            updateSetting("buffer_enabled", e.target.checked)
                          }
                        />
                      </label>
                    </div>
                  </div>

                  <div className="card sch-preview-card">
                    <div className="card-header">
                      <h2 className="card-title">
                        <i className="ti ti-eye" aria-hidden="true" /> Slots
                        Preview
                      </h2>
                      <span className="sch-generated-badge">
                        Generated: {preview.weeklyTotal}
                      </span>
                    </div>
                    <div className="sch-preview-body">
                      {preview.dayTotal === 0 ? (
                        <p className="sch-note">
                          Turn on a day and at least one session to see a
                          preview.
                        </p>
                      ) : (
                        SESSION_DEFS.map(({ key, label }) => {
                          const times = preview.bySession[key];
                          if (!times.length) return null;
                          const first = times[0];
                          const last = times[times.length - 1];
                          return (
                            <div className="sch-preview-session" key={key}>
                              <div className="sch-preview-session-header">
                                <span>{label.toUpperCase()} SESSION</span>
                                <span>
                                  {first} - {last}
                                </span>
                              </div>
                              <div className="sch-preview-pills">
                                {times.map((t) => (
                                  <span className="sch-pill" key={t}>
                                    {t}
                                  </span>
                                ))}
                              </div>
                            </div>
                          );
                        })
                      )}
                      <p className="sch-note" style={{ marginTop: 12 }}>
                        This preview reflects one representative active day. It
                        updates as you edit, but nothing here is saved or
                        bookable until you save the schedule and generate slots
                        for real dates.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {loading && <p className="sch-note">Loading schedule…</p>}
        </main>
      </div>
    </div>
  );
}
