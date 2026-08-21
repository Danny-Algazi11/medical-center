import api from "./axios";

// Inbox — every consultation thread the current user (doctor or patient) is
// a participant in, across all their appointments.
export const getConsultations = (params) => api.get("/consultations", { params });

// Get-or-create the chat thread for a specific appointment.
export const getConsultation = (appointmentId) =>
  api.get(`/appointments/${appointmentId}/consultation`);

export const getConsultationMessages = (appointmentId, params) =>
  api.get(`/appointments/${appointmentId}/consultation/messages`, { params });

export const sendConsultationMessage = (appointmentId, content) =>
  api.post(`/appointments/${appointmentId}/consultation/messages`, { content });

export const markConsultationRead = (appointmentId) =>
  api.post(`/appointments/${appointmentId}/consultation/messages/read`);
