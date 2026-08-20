import api from "./axios";

// GET /doctor/appointments/{appointmentId}/medical-record — role:doctor.
// Access is gated server-side by AccessGuard: full access while the
// appointment is checked_in/in_progress, read-only starting 48h before a
// scheduled slot, none outside that window and none once the appointment
// is completed/cancelled/no_show. A denial comes back as a 403 with a
// clear message — surface it as-is rather than guessing at the rule
// client-side.
// Returns: { access_level: "full"|"read_only", patient: {...}, medical_record: {...} }
export const getAppointmentMedicalRecord = async (appointmentId) => {
  const response = await api.get(
    `/doctor/appointments/${appointmentId}/medical-record`,
  );
  return response.data.data;
};

// GET /doctor/appointments/{patientId}/profile — role:doctor. Lighter-
// weight than the medical-record endpoint above: no AccessGuard time-
// window check, just the patient's summary plus every encounter tied to
// an appointment between this doctor and this patient, regardless of
// that appointment's status. Good for a quick "who is this patient"
// lookup from an appointment list row, not a substitute for the
// access-gated full record.
export const getPatientProfile = async (patientId) => {
  const response = await api.get(`/doctor/appointments/${patientId}/profile`);
  return response.data.data;
};
