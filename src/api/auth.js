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

export const registerDoctor = async (basic) => {
  const payload = {
    role: "doctor",
    first_name: basic.firstName,
    last_name: basic.lastName,
    email: basic.email,
    password: basic.password,
    password_confirmation: basic.confirmPassword,
    ID_card_number: basic.idCardNumber,
  };

  try {
    const response = await api.post("/auth/register", payload);

    console.log("REGISTER SUCCESS RESPONSE:", response);

    const token = response.data.data?.token;
    if (token) {
      localStorage.setItem("token", token);
    }

    return response.data.data;
  } catch (error) {
    console.log("REGISTER ERROR RESPONSE:", error.response);
    throw error;
  }
};

export const completeDoctorProfile = async (profile, uploads, doctorPath) => {
  const form = new FormData();

  // Shared fields
  form.append("phone", profile.phone);
  form.append("dob", profile.dob);
  form.append("gender", profile.gender);
  form.append("address", profile.address);
  form.append("blood_type", profile.bloodType || "");
  form.append("practice_start_date", profile.practiceStartDate);
  form.append("department_ids[]", profile.departmentId);

  // Required by backend
  form.append("device_name", "web");

  // Doctor clinic mode
  if (doctorPath === "join") {
    form.append("registration_mode", "join_clinic");
    form.append("clinic_id", profile.clinicId);
  } else {
    form.append("registration_mode", "create_clinic");
    form.append("clinic_name", profile.clinicName);
    form.append("clinic_address", profile.clinicAddress);
    form.append("clinic_phone", profile.clinicPhone);
  }

  // Uploads
  if (uploads.idPhoto?.length) {
    form.append("id_card", uploads.idPhoto[0]);
  }

  if (uploads.personalPhoto?.length) {
    form.append("photo", uploads.personalPhoto[0]);
  }

  if (uploads.licenses?.length) {
    form.append("license_file", uploads.licenses[0]);
  }

  if (uploads.certificates?.length) {
    uploads.certificates.forEach((file) => {
      form.append("certificates[]", file);
    });
  }

  if (uploads.clinicLicense?.length) {
    form.append("clinic_license_file", uploads.clinicLicense[0]);
  }

  console.log("=== FORM DATA SENT TO BACKEND ===");
for (let pair of form.entries()) {
  console.log(pair[0] + ": ", pair[1]);
}
console.log("=== END FORM DATA ===");

  const token = localStorage.getItem("token");

const response = await api.post("/auth/complete-profile", form, {
  headers: {
    "Content-Type": "multipart/form-data",
    Authorization: `Bearer ${token}`,
  },
});

  return response.data;
};

export const verifyEmailCode = async (code) => {
  try {
    const response = await api.post("/auth/email/verify-code", { code });

    console.log("VERIFY SUCCESS RESPONSE:", response);

    const token = response.data.data?.token || response.data.token;
    if (token) {
      localStorage.setItem("token", token);
    }

    return response.data;
  } catch (error) {
    console.log("VERIFY ERROR RESPONSE:", error.response);
    throw error;
  }
};

export const resendCode = async () => {
  const response = await api.post("/auth/resend-code");
  return response.data;
};
