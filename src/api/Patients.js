import api from "./axios";

// GET /receptionist/patients/search?q=... — role:receptionist, min 2 chars.
// Searches active patients by name, phone, or ID card number. Used to
// locate a patient before booking an appointment or creating a walk-in.
export const searchPatients = async (query) => {
  const response = await api.get("/receptionist/patients/search", {
    params: { q: query },
  });
  return response.data.data;
};
