import api from "./axios";

// ─────────────────────────────────────────────────────────────
// Doctor self-service — role:doctor, scoped by clinicId (a doctor
// can work at more than one clinic, each with its own schedule).
// ─────────────────────────────────────────────────────────────

// GET /doctor/schedule — every clinic this doctor has a schedule at.
export const getMySchedules = async () => {
  const response = await api.get("/doctor/schedule");
  return response.data.data;
};

// GET /doctor/schedule/{clinicId} — one clinic's schedule config,
// including days + sessions. 404s if never configured yet.
export const getSchedule = async (clinicId) => {
  const response = await api.get(`/doctor/schedule/${clinicId}`);
  return response.data.data;
};

// PUT /doctor/schedule/{clinicId} — full replace. Deletes and
// recreates every day/session for this clinic from what's sent.
// payload: { consultation_duration, break_duration, buffer_enabled,
//   max_patients, days: [{ day_of_week, sessions: [{ session_type,
//   start_time, end_time }] }] }
export const setWeeklySchedule = async (clinicId, payload) => {
  const response = await api.put(`/doctor/schedule/${clinicId}`, payload);
  return response.data.data;
};

// POST /doctor/schedule/{clinicId}/vacation — { start_date, end_date }
// Blocks already-available slots in range, reports any bookings that
// now overlap and need manual attention.
export const activateVacation = async (clinicId, { start_date, end_date }) => {
  const response = await api.post(`/doctor/schedule/${clinicId}/vacation`, {
    start_date,
    end_date,
  });
  return response.data.data;
};

// DELETE /doctor/schedule/{clinicId}/vacation
export const deactivateVacation = async (clinicId) => {
  const response = await api.delete(`/doctor/schedule/${clinicId}/vacation`);
  return response.data.data;
};

// POST /doctor/schedule/{clinicId}/generate-slots — { date_from, date_to }
// Actually materializes bookable DoctorTimeSlot rows from the weekly
// template. Saving the weekly schedule alone does NOT do this — slots
// only exist for date ranges you've explicitly generated. Max 90 days,
// fails if vacation mode is active.
export const generateSlots = async (clinicId, { date_from, date_to }) => {
  const response = await api.post(
    `/doctor/schedule/${clinicId}/generate-slots`,
    { date_from, date_to },
  );
  return response.data;
};

// GET /doctor/schedule/{clinicId}/blocked-times
export const listBlockedTimes = async (clinicId) => {
  const response = await api.get(`/doctor/schedule/${clinicId}/blocked-times`);
  return response.data.data;
};

// POST /doctor/schedule/{clinicId}/blocked-times
// payload needs exactly one of block_date (specific date) or
// day_of_week (0-6, recurring), plus start_time/end_time ("HH:mm").
export const createBlockedTime = async (clinicId, payload) => {
  const response = await api.post(
    `/doctor/schedule/${clinicId}/blocked-times`,
    payload,
  );
  return response.data.data;
};

// DELETE /doctor/schedule/blocked-times/{id}
export const deleteBlockedTime = async (id) => {
  await api.delete(`/doctor/schedule/blocked-times/${id}`);
};

// ─────────────────────────────────────────────────────────────
// Receptionist on-behalf — role:receptionist. Scoped by doctorId;
// the receptionist's own clinic is resolved server-side. No vacation
// endpoints exist for this role, and there's no GET to view a
// doctor's current schedule before overwriting it with setWeekly.
// ─────────────────────────────────────────────────────────────

// GET /receptionist/doctors/{doctorId}/schedule — the doctor's current
// schedule config, same shape as the doctor-side show(). Lets the
// receptionist's form start pre-filled instead of blank.
export const receptionistGetSchedule = async (doctorId) => {
  const response = await api.get(`/receptionist/doctors/${doctorId}/schedule`);
  return response.data.data;
};

export const receptionistSetWeeklySchedule = async (doctorId, payload) => {
  const response = await api.put(
    `/receptionist/doctors/${doctorId}/schedule`,
    payload,
  );
  return response.data.data;
};

export const receptionistGenerateSlots = async (
  doctorId,
  { date_from, date_to },
) => {
  const response = await api.post(
    `/receptionist/doctors/${doctorId}/schedule/generate-slots`,
    { date_from, date_to },
  );
  return response.data;
};

export const receptionistListBlockedTimes = async (doctorId) => {
  const response = await api.get(
    `/receptionist/doctors/${doctorId}/schedule/blocked-times`,
  );
  return response.data.data;
};

export const receptionistCreateBlockedTime = async (doctorId, payload) => {
  const response = await api.post(
    `/receptionist/doctors/${doctorId}/schedule/blocked-times`,
    payload,
  );
  return response.data.data;
};

export const receptionistDeleteBlockedTime = async (id) => {
  await api.delete(`/receptionist/schedule/blocked-times/${id}`);
};

// ─────────────────────────────────────────────────────────────
// Public doctor directory — no auth role required. Used to power the
// receptionist's "Switch Doctor" picker (their own clinic_id comes
// from useAuth()'s user.profile.clinic). Note: only returns verified
// doctors at an active clinic who already have >=1 active schedule
// config — a brand-new doctor with zero schedule won't show up yet.
// ─────────────────────────────────────────────────────────────
export const searchDoctorsByClinic = async (clinicId) => {
  const response = await api.get("/doctors", {
    params: { clinic_id: clinicId, per_page: 50 },
  });
  return response.data.data;
};
