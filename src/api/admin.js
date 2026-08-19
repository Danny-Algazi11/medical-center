import api from "./axios";

/*
|--------------------------------------------------------------------------
| Dashboard Stats
|--------------------------------------------------------------------------
| Endpoints are paginated (meta.total), so we read counts from meta,
| not from data.length (which is capped at per_page).
|--------------------------------------------------------------------------
*/

// NOTE: the collection has no admin-facing "list receptionists" or
// "list patients" endpoint (only registration under /auth/register) —
// calling /admin/receptionists or /admin/patient 404s. Stats are limited
// to what /admin/doctors, /admin/clinics, and /admin/departments confirm.
export const getDashboardStats = async () => {
  const [doctors, clinics, departments] = await Promise.all([
    api.get("/admin/doctors"),
    api.get("/admin/clinics"),
    api.get("/admin/departments"),
  ]);

  return {
    totalDoctors: doctors.data.meta?.total ?? doctors.data.data.length,
    totalClinics: clinics.data.meta?.total ?? clinics.data.data.length,
    totalDepartments:
      departments.data.meta?.total ?? departments.data.data.length,
  };
};

/*
|--------------------------------------------------------------------------
| Clinics (Admin)  — matches "Admin > Clinics" folder in the collection
|--------------------------------------------------------------------------
*/

export const getClinics = (params) => api.get("/admin/clinics", { params });

export const getPendingClinics = (params) =>
  api.get("/admin/clinics/pending", { params });

export const createClinic = (data) => api.post("/admin/clinics", data);

export const updateClinic = (id, data) => api.put(`/admin/clinics/${id}`, data);

export const approveClinic = (id) => api.post(`/admin/clinics/${id}/approve`);

export const rejectClinic = (id, reason) =>
  api.post(`/admin/clinics/${id}/reject`, { reason });

export const suspendClinic = (id, reason) =>
  api.post(`/admin/clinics/${id}/suspend`, { reason });

export const reactivateClinic = (id, reason) =>
  api.post(`/admin/clinics/${id}/reactivate`, { reason });

// PUT /admin/clinics/:id/departments  { department_ids: [..] }
export const syncClinicDepartments = (id, departmentIds) =>
  api.put(`/admin/clinics/${id}/departments`, {
    department_ids: departmentIds,
  });

/*
|--------------------------------------------------------------------------
| Departments (Admin) — matches "Admin > Department" folder
|--------------------------------------------------------------------------
*/

export const getDepartments = (params) =>
  api.get("/admin/departments", { params });

export const createDepartment = (data) => api.post("/admin/departments", data);

export const updateDepartment = (id, data) =>
  api.put(`/admin/departments/${id}`, data);

// Returns 409 if the department is still linked to clinics/doctors —
// surface err.message to the user, don't optimistically remove it.
export const deleteDepartment = (id) => api.delete(`/admin/departments/${id}`);

/*
|--------------------------------------------------------------------------
| Doctors (Admin) — matches "Admin > Doctors" folder
|--------------------------------------------------------------------------
*/

// GET /admin/doctors?status=pending&department_id=1 — confirmed by the collection
export const getDoctors = (params) => api.get("/admin/doctors", { params });

export const getPendingDoctors = (params) =>
  api.get("/admin/doctors/pending", { params });

export const approveDoctor = (id) => api.post(`/admin/doctors/${id}/approve`);

export const rejectDoctor = (id, reason) =>
  api.post(`/admin/doctors/${id}/reject`, { reason });

export const suspendDoctor = (id, reason) =>
  api.post(`/admin/doctors/${id}/suspend`, { reason });

export const reactivateDoctor = (id) =>
  api.post(`/admin/doctors/${id}/reactivate`);

/*
|--------------------------------------------------------------------------
| Public (unauthenticated) reference data — used to populate dropdowns
| instead of the hardcoded SPECIALTIES / CLINICS arrays in the UI.
|--------------------------------------------------------------------------
*/

export const getPublicClinics = () => api.get("/clinics");
export const getPublicDepartments = () => api.get("/departments");

/*
|--------------------------------------------------------------------------
| Auth (Admin)
|--------------------------------------------------------------------------
*/

export const changePassword = (data) => api.post("/auth/change-password", data);

export const completeProfile = (data) =>
  api.post("/auth/complete-profile", data);

/*
|--------------------------------------------------------------------------
| NOTE — Not present anywhere in the Postman collection:
|   - deleteDoctor / listDoctors (DoctorManagement.jsx currently calls these)
|   - deleteClinic / activateClinic / deactivateClinic (ClinicManagement.jsx)
|   - getComplaints (AdminDashboard.jsx)
| These need either a real backend endpoint or the UI calls need to be
| swapped for the closest real action (e.g. suspend/reactivate instead
| of activate/deactivate). See my message for the full breakdown.
|--------------------------------------------------------------------------
*/
