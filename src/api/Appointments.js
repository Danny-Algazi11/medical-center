import api from "./axios";

// ─────────────────────────────────────────────────────────────
// Doctor — role:doctor
// ─────────────────────────────────────────────────────────────

// GET /doctor/appointments — filters: status, date ("YYYY-MM-DD"), page
export const getDoctorAppointments = async (params = {}) => {
  const response = await api.get("/doctor/appointments", { params });
  return { items: response.data.data, meta: response.data.meta };
};

export const getDoctorAppointment = async (id) => {
  const response = await api.get(`/doctor/appointments/${id}`);
  return response.data.data;
};

// checked_in -> in_progress
export const startAppointment = async (id) => {
  const response = await api.post(`/doctor/appointments/${id}/start`);
  return response.data.data;
};

// in_progress -> completed
export const completeAppointment = async (id) => {
  const response = await api.post(`/doctor/appointments/${id}/complete`);
  return response.data.data;
};

// any non-terminal status -> cancelled. reason is required by the backend.
export const cancelDoctorAppointment = async (id, reason) => {
  const response = await api.post(`/doctor/appointments/${id}/cancel`, {
    reason,
  });
  return response.data.data;
};

// scheduled -> no_show (only valid from "scheduled")
export const markDoctorNoShow = async (id) => {
  const response = await api.post(`/doctor/appointments/${id}/no-show`);
  return response.data.data;
};

// ─────────────────────────────────────────────────────────────
// Receptionist — role:receptionist. Scoped to their own clinic
// server-side; doctor_id filter narrows within that clinic.
// ─────────────────────────────────────────────────────────────

// GET /receptionist/appointments — filters: status, doctor_id, date, page
export const getReceptionistAppointments = async (params = {}) => {
  const response = await api.get("/receptionist/appointments", { params });
  return { items: response.data.data, meta: response.data.meta };
};

export const getReceptionistAppointment = async (id) => {
  const response = await api.get(`/receptionist/appointments/${id}`);
  return response.data.data;
};

// scheduled -> checked_in
export const checkInAppointment = async (id) => {
  const response = await api.post(`/receptionist/appointments/${id}/check-in`);
  return response.data.data;
};

export const cancelReceptionistAppointment = async (id, reason) => {
  const response = await api.post(`/receptionist/appointments/${id}/cancel`, {
    reason,
  });
  return response.data.data;
};

// scheduled -> no_show
export const markReceptionistNoShow = async (id) => {
  const response = await api.post(`/receptionist/appointments/${id}/no-show`);
  return response.data.data;
};

// POST /receptionist/appointments — book a scheduled appointment on a
// patient's behalf against a specific already-available slot_id.
export const receptionistBookAppointment = async ({
  patient_id,
  slot_id,
  encounter_type,
  notes,
}) => {
  const response = await api.post("/receptionist/appointments", {
    patient_id,
    slot_id,
    encounter_type,
    notes,
  });
  return response.data.data;
};

// POST /receptionist/appointments/walk-in — no slot involved; the
// appointment is created directly in "checked_in" status.
export const createWalkIn = async ({
  patient_id,
  doctor_id,
  encounter_type,
  notes,
}) => {
  const response = await api.post("/receptionist/appointments/walk-in", {
    patient_id,
    doctor_id,
    encounter_type,
    notes,
  });
  return response.data.data;
};

// Booking a new appointment / walk-in creation is intentionally not wired
// here — both require a patient_id, and there's no backend endpoint to
// look up a patient by name/phone yet. See conversation notes.
