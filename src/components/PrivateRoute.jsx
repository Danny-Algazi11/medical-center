import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Roles allowed per route — omit to allow any authenticated user
const ROUTE_ROLES = {
  "/reception": ["receptionist"],
  "/dashboard": ["doctor"],
  "/profile": ["doctor"],
  "/schedule": ["doctor", "receptionist"],
  "/admin": ["admin"],
  "/admin/doctors": ["admin"],
  "/admin/clinics": ["admin"],
  "/admin/complaints": ["admin"],
  "/admin/ratings": ["admin"],
  "/admin/analytics": ["admin"],
  "/admin/audit": ["admin"],
};

export default function PrivateRoute({ children }) {
  const { user, initializing } = useAuth();
  const { pathname } = useLocation();

  // Still verifying a stored token against the server — don't redirect yet.
  if (initializing) {
    return <div className="auth-loading">Loading…</div>;
  }

  // Not logged in → send to login, remember where they were going
  if (!user) {
    return <Navigate to="/login" state={{ from: pathname }} replace />;
  }

  // Logged in but wrong role for this route
  const allowed = ROUTE_ROLES[pathname];
  if (allowed && !allowed.includes(user.role)) {
    const ROLE_HOME = {
      doctor: "/dashboard",
      receptionist: "/reception",
      admin: "/admin",
    };
    return <Navigate to={ROLE_HOME[user.role] || "/login"} replace />;
  }

  return children;
}
