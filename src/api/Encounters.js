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

// POST .../encounter/submit — batch endpoint (SubmitEncounterRequest).
// Takes notes/diagnoses/prescription_items together in one request instead
// of three separate calls. Each section is optional on its own, but at
// least one of the three must be non-empty. Returns the full
// EncounterResource (id, clinical_notes, diagnoses, prescription) in one
// shot, unlike the per-item endpoints above which each only return their
// own new row.
// payload: { notes?: [{content}], diagnoses?: [{label, description?}],
//            prescription_items?: [{drug_name, form?, strength?, dosage?,
//            frequency?, duration?, route?, notes?}] }
export const submitEncounter = async (appointmentId, payload) => {
  const response = await api.post(
    `/doctor/appointments/${appointmentId}/encounter/submit`,
    payload,
  );
  return response.data.data;
};

// Writing is only permitted while the appointment is exactly "in_progress"
// (EncounterService::ensureCanWrite) — not "checked_in", even though read
// access covers both.
