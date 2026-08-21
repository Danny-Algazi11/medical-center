import api from "./axios";

/*
|--------------------------------------------------------------------------
| Dashboard Stats
|--------------------------------------------------------------------------
| No dedicated stats endpoint — AdminDashboard derives counts from
| meta.total on the doctors/clinics/departments list calls it already
| makes for the "recent" tables, instead of fetching each list twice.
|--------------------------------------------------------------------------
*/

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
| Doctor Reports / Complaints (Admin) — matches routes in
| app/Modules/DoctorEngagement/routes.php ("Admin" group)
|--------------------------------------------------------------------------
*/

// GET /admin/reports?status=&category=&doctor_id=&per_page=
export const getReports = (params) => api.get("/admin/reports", { params });

export const markReportUnderReview = (id) =>
  api.post(`/admin/reports/${id}/review`);

// status: "action_taken" | "resolved" | "dismissed"
export const resolveReport = (id, data) =>
  api.post(`/admin/reports/${id}/resolve`, data);

/*
|--------------------------------------------------------------------------
| Doctor Reviews / Ratings (Admin) — matches
| app/Modules/Administration/routes.php ("doctors/{doctorId}/reviews")
|--------------------------------------------------------------------------
*/

export const getDoctorReviews = (doctorId, params) =>
  api.get(`/admin/doctors/${doctorId}/reviews`, { params });

/*
|--------------------------------------------------------------------------
| Analytics (Admin) — matches app/Modules/Administration/routes.php
|--------------------------------------------------------------------------
*/

export const getAnalyticsDashboard = () => api.get("/admin/analytics/dashboard");

export const getAppointmentStats = (params) =>
  api.get("/admin/analytics/appointments", { params });

export const getDoctorPerformance = (params) =>
  api.get("/admin/analytics/doctors/performance", { params });

export const getUserEngagement = (params) =>
  api.get("/admin/analytics/users/engagement", { params });

export const getReportsSummary = () =>
  api.get("/admin/analytics/reports/summary");

/*
|--------------------------------------------------------------------------
| Audit Logs (Admin) — matches app/Modules/Administration/routes.php
|--------------------------------------------------------------------------
*/

// GET /admin/audit-logs?action=&entity_type=&user_id=&from=&to=&per_page=
export const getAuditLogs = (params) => api.get("/admin/audit-logs", { params });

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
| NOTE — confirmed absent from the backend (checked against the actual
| Laravel routes in Project1, not just the Postman collection):
|   - deleteClinic / activateClinic / deactivateClinic — only
|     approve/reject/suspend/reactivate exist for clinics.
|   - "Flag" / "Remove" a review — DoctorReview only has patient-owned
|     submit/delete; there is no admin moderation endpoint for reviews.
|   - Per-star rating breakdown (5★/4★/.../1★ counts) — reviews summary
|     only returns { total_reviews, average_rating }, no histogram.
|   - Revenue, monthly time series, and "appointments by type" — none of
|     the analytics endpoints expose money or a date-bucketed breakdown;
|     appointment stats are a single { total, by_status } snapshot.
|--------------------------------------------------------------------------
*/
