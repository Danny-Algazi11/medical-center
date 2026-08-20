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
