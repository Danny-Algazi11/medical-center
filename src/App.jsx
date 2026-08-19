import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { SettingsProvider } from "./context/SettingsContext";
import PrivateRoute from "./components/PrivateRoute";

import LandingPage from "./components/LandingPage";
import LoginPage from "./components/LoginPage";
import SignupPage from "./components/SignupPage";
import DoctorDashboard from "./components/DoctorDashboard";
import AppointmentsPage from "./components/AppointmentsPage";
import PatientsPage from "./components/PatientsPage";
import MessagesPage from "./components/MessagesPage";
import MedicalRecordsPage from "./components/MedicalrecordsPage";
import ReceptionDashboard from "./components/ReceptionDashboard";
import SettingsPage from "./components/SettingsPage";
import DoctorPendingApprovalPage from "./components/DoctorPendingApprovalPage";
import AdminDashboard from "./admin/AdminDashboard";
import DoctorManagement from "./admin/DoctorManagement";
import DoctorDetailPage from "./admin/DoctorDetailPage";
import ClinicManagement from "./admin/ClinicManagement";
import ClinicDetailPage from "./admin/ClinicDetailPage";
import ComplaintsPage from "./admin/ComplaintsPage";
import RatingsPage from "./admin/RatingsPage";
import AnalyticsPage from "./admin/AnalyticsPage";
import AuditLogsPage from "./admin/AuditLogsPage";

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route
              path="/doctor-pending"
              element={<DoctorPendingApprovalPage role="doctor" />}
            />
            <Route
              path="/reception-pending"
              element={<DoctorPendingApprovalPage role="reception" />}
            />
            {/* Protected routes */}
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <DoctorDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/appointments"
              element={
                <PrivateRoute>
                  <AppointmentsPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/patients"
              element={
                <PrivateRoute>
                  <PatientsPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/messages"
              element={
                <PrivateRoute>
                  <MessagesPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/medical-records"
              element={
                <PrivateRoute>
                  <MedicalRecordsPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/reception"
              element={
                <PrivateRoute>
                  <ReceptionDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <PrivateRoute>
                  <SettingsPage />
                </PrivateRoute>
              }
            />
            {/* admin routes */}
            <Route
              path="/admin"
              element={
                <PrivateRoute>
                  <AdminDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/doctors"
              element={
                <PrivateRoute>
                  <DoctorManagement />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/doctors/:id"
              element={
                <PrivateRoute>
                  <DoctorDetailPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/clinics"
              element={
                <PrivateRoute>
                  <ClinicManagement />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/clinics/:id"
              element={
                <PrivateRoute>
                  <ClinicDetailPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/complaints"
              element={
                <PrivateRoute>
                  <ComplaintsPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/ratings"
              element={
                <PrivateRoute>
                  <RatingsPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <PrivateRoute>
                  <AnalyticsPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/audit"
              element={
                <PrivateRoute>
                  <AuditLogsPage />
                </PrivateRoute>
              }
            />
            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </SettingsProvider>
    </AuthProvider>
  );
}
