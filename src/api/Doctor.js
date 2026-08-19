import api from "./axios";

// GET /doctor/profile — full profile as shown to the doctor themselves.
export const getDoctorProfile = async () => {
  const response = await api.get("/doctor/profile");
  return response.data.data;
};

// PUT /doctor/profile — partial update. Only send fields that changed;
// the backend's rules are all `sometimes`, so omitted fields are left as-is.
// Accepts: first_name, last_name, phone, address, biography,
// online_consultation_fee, languages[], qualifications[{degree,institution,year}]
export const updateDoctorProfile = async (data) => {
  const response = await api.put("/doctor/profile", data);
  return response.data.data;
};

// PUT /doctor/profile/clinics/{clinic}/fee — update the doctor's per-clinic
// (in-person) consultation fee. Distinct from online_consultation_fee above,
// which lives on the profile itself, not on a specific clinic membership.
export const updateClinicFee = async (clinicId, fee) => {
  const response = await api.put(`/doctor/profile/clinics/${clinicId}/fee`, {
    consultation_fee: fee,
  });
  return response.data.data;
};

// POST /doctor/profile/clinics/join — join an existing (active) clinic using
// its 10-character clinic code. The doctor's own department memberships are
// auto-attached server-side — this call does not take department_ids.
export const joinClinic = async ({ clinic_code, consultation_fee }) => {
  const response = await api.post("/doctor/profile/clinics/join", {
    clinic_code,
    consultation_fee,
  });
  return response.data.data;
};

// POST /doctor/profile/clinics/create — create a brand-new clinic (goes
// live as "pending", needs admin approval). Multipart: includes
// clinic_license_file. Like join, department attachment is automatic.
export const createClinic = async ({
  clinic_name,
  clinic_address,
  clinic_phone,
  latitude,
  longitude,
  consultation_fee,
  clinic_license_file,
}) => {
  const form = new FormData();
  form.append("clinic_name", clinic_name);
  form.append("clinic_address", clinic_address);
  if (clinic_phone) form.append("clinic_phone", clinic_phone);
  form.append("latitude", latitude);
  form.append("longitude", longitude);
  form.append("consultation_fee", consultation_fee);
  form.append("clinic_license_file", clinic_license_file);
  const response = await api.post("/doctor/profile/clinics/create", form);
  return response.data.data;
};

// POST /doctor/profile/photo — multipart, field name "photo"
export const uploadDoctorPhoto = async (file) => {
  const form = new FormData();
  form.append("photo", file);
  const response = await api.post("/doctor/profile/photo", form);
  return response.data.data;
};

// POST /doctor/profile/certificates — multipart, field name "certificate" (singular, one at a time)
export const uploadDoctorCertificate = async (file) => {
  const form = new FormData();
  form.append("certificate", file);
  const response = await api.post("/doctor/profile/certificates", form);
  return response.data.data;
};
