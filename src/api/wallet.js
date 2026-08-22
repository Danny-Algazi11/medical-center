import api from "./axios";

/*
|--------------------------------------------------------------------------
| Wallet (Doctor) — matches app/Modules/Payments/routes.php
| ["auth:sanctum", "role:doctor"] group, prefix "doctor/wallet"
|--------------------------------------------------------------------------
*/

export const getDoctorWallet = () => api.get("/doctor/wallet");

export const getDoctorWalletTransactions = (params) =>
  api.get("/doctor/wallet/transactions", { params });

export const createWithdrawalRequest = (data) =>
  api.post("/doctor/wallet/withdrawal-requests", data);

export const getDoctorWithdrawalRequests = (params) =>
  api.get("/doctor/wallet/withdrawal-requests", { params });

/*
|--------------------------------------------------------------------------
| Wallet (Patient) — prefix "patient/wallet"
|--------------------------------------------------------------------------
*/

export const getPatientWallet = () => api.get("/patient/wallet");

export const getPatientWalletTransactions = (params) =>
  api.get("/patient/wallet/transactions", { params });

export const createTopUpRequest = (data) =>
  api.post("/patient/wallet/top-up-requests", data);

export const getPatientTopUpRequests = (params) =>
  api.get("/patient/wallet/top-up-requests", { params });

export const getAppointmentPaymentOptions = (slotId) =>
  api.get("/patient/wallet/payment-options", { params: { slot_id: slotId } });

/*
|--------------------------------------------------------------------------
| Wallet (Admin) — prefix "admin/wallet", role:admin
|--------------------------------------------------------------------------
*/

export const getFinancialSummary = () => api.get("/admin/wallet/summary");

export const getPlatformWallet = () => api.get("/admin/wallet/platform");

export const getPlatformTransactions = (params) =>
  api.get("/admin/wallet/platform/transactions", { params });

export const getTopUpRequests = (params) =>
  api.get("/admin/wallet/top-up-requests", { params });

export const approveTopUp = (id) =>
  api.post(`/admin/wallet/top-up-requests/${id}/approve`);

export const rejectTopUp = (id, adminNote) =>
  api.post(`/admin/wallet/top-up-requests/${id}/reject`, {
    admin_note: adminNote,
  });

export const getWithdrawalRequests = (params) =>
  api.get("/admin/wallet/withdrawal-requests", { params });

export const approveWithdrawal = (id) =>
  api.post(`/admin/wallet/withdrawal-requests/${id}/approve`);

export const rejectWithdrawal = (id, adminNote) =>
  api.post(`/admin/wallet/withdrawal-requests/${id}/reject`, {
    admin_note: adminNote,
  });
