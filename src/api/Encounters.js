import api from "./axios";

// GET /doctor/appointments/{appointmentId}/encounter — the encounter tied
// to this specific appointment (not the patient's whole history), or null
// if nothing's been documented for this visit yet.
export const getEncounter = async (appointmentId) => {
  const response = await api.get(
    `/doctor/appointments/${appointmentId}/encounter`,
  );
  return response.data.data;
};

// POST .../encounter/notes
export const addClinicalNote = async (appointmentId, content) => {
  const response = await api.post(
    `/doctor/appointments/${appointmentId}/encounter/notes`,
    { content },
  );
  return response.data.data;
};

// POST .../encounter/diagnoses
export const addDiagnosis = async (appointmentId, { label, description }) => {
  const response = await api.post(
    `/doctor/appointments/${appointmentId}/encounter/diagnoses`,
    { label, description: description || undefined },
  );
  return response.data.data;
};

// POST .../encounter/prescription-items — note: returns the *whole*
// prescription (all items so far), not just the newly added item.
export const addPrescriptionItem = async (appointmentId, payload) => {
  const response = await api.post(
    `/doctor/appointments/${appointmentId}/encounter/prescription-items`,
    payload,
  );
  return response.data.data;
};

// Writing is only permitted while the appointment is exactly "in_progress"
// (EncounterService::ensureCanWrite) — not "checked_in", even though read
// access covers both. There's also a batch POST .../encounter/submit that
// accepts notes/diagnoses/prescription_items all in one request instead of
// three separate calls — not used here in favor of the more natural
// incremental per-item flow, but available if ever needed.
