import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import PrivateRoute from "./components/PrivateRoute";

import LandingPage from "./components/LandingPage";
import LoginPage from "./components/LoginPage";
import SignupPage from "./components/SignupPage";
import DoctorDashboard from "./components/DoctorDashboard";
import AppointmentsPage from "./components/AppointmentsPage";
import PatientsPage from "./components/PatientsPage";
import MessagesPage from "./components/MessagesPage";
import MedicalRecordsPage from "./components/MedicalRecordsPage";
import ReceptionDashboard from "./components/ReceptionDashboard";
import AdminDashboard from "./admin/AdminDashboard";
import DoctorManagement from "./admin/DoctorManagement";
import ClinicManagement from "./admin/ClinicManagement";
import ComplaintsPage from "./admin/ComplaintsPage";
import RatingsPage from "./admin/RatingsPage";
import AnalyticsPage from "./admin/AnalyticsPage";
import AuditLogsPage from "./admin/AuditLogsPage";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
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
          //admin routes
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
            path="/admin/clinics"
            element={
              <PrivateRoute>
                <ClinicManagement />
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
    </AuthProvider>
  );
}
