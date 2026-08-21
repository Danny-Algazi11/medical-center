import api from "./axios";

// LOGIN
export const login = async (email, password) => {
  const response = await api.post("/auth/login", { email, password });

  const token = response.data.data.token;
  localStorage.setItem("token", token);

  return response.data;
};

// GET AUTHENTICATED USER
export const getMe = async () => {
  const response = await api.get("/auth/me");
  return response.data.data;
};

// LOGOUT
export const logout = async () => {
  await api.post("/auth/logout");
  localStorage.removeItem("token");
};

// CHANGE PASSWORD — POST /auth/change-password, role-agnostic (works for
// doctor, receptionist, and admin alike). Backend's ChangePasswordRequest
// requires current_password + password (min 8, confirmed via
// password_confirmation).
export const changePassword = async (currentPassword, password, passwordConfirmation) => {
  const response = await api.post("/auth/change-password", {
    current_password: currentPassword,
    password,
    password_confirmation: passwordConfirmation,
  });
  return response.data;
};

// REGISTER
// Takes the selected role explicitly instead of hardcoding "doctor" — this
// is what was silently registering every receptionist as a doctor.
export const registerDoctor = async (basic, role) => {
  const payload = {
    role: role === "reception" ? "receptionist" : role,
    first_name: basic.firstName,
    last_name: basic.lastName,
    email: basic.email,
    password: basic.password,
    password_confirmation: basic.confirmPassword,
    ID_card_number: basic.idCardNumber,
  };
  // Backend's clinic_code rule has no `nullable` guard on the register
  // endpoint — sending clinic_code: null for a doctor still runs
  // exists:clinics,code against null and fails. Only include the key
  // at all for receptionists. Must be exactly 10 characters.
  if (role === "reception") payload.clinic_code = basic.clinicCode;

  const response = await api.post("/auth/register", payload);

  const token = response.data.data?.token;
  if (token) {
    localStorage.setItem("token", token);
  }

  return response.data.data;
};

// COMPLETE PROFILE
// Now takes `role` so doctor-only fields (registration_mode, clinic_*)
// are only sent for doctors — sending registration_mode for a receptionist
// fails validation, since the backend rule is 'prohibited' for non-doctors.
export const completeDoctorProfile = async (
  profile,
  uploads,
  doctorPath,
  role,
) => {
  const form = new FormData();

  // Shared fields
  form.append("phone", profile.phone);
  form.append("dob", profile.dob);
  form.append("gender", profile.gender);
  form.append("address", profile.address);
  if (profile.bloodType) form.append("blood_type", profile.bloodType);
  form.append("device_name", "web");

  if (role === "doctor") {
    if (profile.practiceStartDate) {
      form.append("practice_start_date", profile.practiceStartDate);
    }

    if (Array.isArray(profile.departmentIds)) {
      profile.departmentIds.forEach((id) => {
        if (id) form.append("department_ids[]", id);
      });
    } else if (profile.departmentIds) {
      form.append("department_ids[]", profile.departmentIds);
    }

    if (profile.consultationFee) {
      form.append("consultation_fee", profile.consultationFee);
    }

    if (doctorPath === "join") {
      form.append("registration_mode", "join_clinic");
      form.append("clinic_code", profile.clinicCode);
    } else if (doctorPath === "create") {
      form.append("registration_mode", "create_clinic");
      form.append("clinic_name", profile.clinicName);
      form.append("clinic_address", profile.clinicAddress);
      if (profile.clinicPhone) form.append("clinic_phone", profile.clinicPhone);
      if (profile.latitude != null) form.append("latitude", profile.latitude);
      if (profile.longitude != null) form.append("longitude", profile.longitude);
    }

    if (uploads.idPhoto?.length) form.append("id_card", uploads.idPhoto[0]);
    if (uploads.personalPhoto?.length)
      form.append("photo", uploads.personalPhoto[0]);
    if (uploads.license?.length)
      form.append("license_file", uploads.license[0]);
    if (uploads.certificates?.length) {
      uploads.certificates.forEach((file) =>
        form.append("certificates[]", file),
      );
    }
    if (uploads.clinicLicense?.length) {
      form.append("clinic_license_file", uploads.clinicLicense[0]);
    }
  }

  // IMPORTANT: no manual Content-Type header. FormData needs the browser
  // to generate "multipart/form-data; boundary=..." itself — overriding it
  // with a plain string (no boundary) breaks Laravel's multipart parsing,
  // so $_POST and $_FILES both come through empty. Authorization is kept
  // explicit here in case the shared axios instance doesn't already attach it.
  const token = localStorage.getItem("token");
  const response = await api.post("/auth/complete-profile", form, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const newToken = response.data.data?.token;
  if (newToken) localStorage.setItem("token", newToken);

  return response.data;
};

// VERIFY EMAIL CODE
export const verifyEmailCode = async (code) => {
  const response = await api.post("/auth/email/verify-code", { code });

  const token = response.data.data?.token || response.data.token;
  if (token) {
    localStorage.setItem("token", token);
  }

  return response.data;
};

// RESEND VERIFICATION CODE
// Was posting to /auth/resend-code — the real route is /auth/email/resend-code.
export const resendCode = async () => {
  const response = await api.post("/auth/email/resend-code");
  return response.data;
};
