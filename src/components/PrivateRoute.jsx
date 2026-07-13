import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Roles allowed per route — omit to allow any authenticated user
const ROUTE_ROLES = {
  "/reception": ["receptionist"],
  "/dashboard": ["doctor"],
  "/admin": ["admin"],
  "/admin/doctors": ["admin"],
  "/admin/clinics": ["admin"],
  "/admin/complaints": ["admin"],
  "/admin/ratings": ["admin"],
  "/admin/analytics": ["admin"],
  "/admin/audit": ["admin"],
};

export default function PrivateRoute({ children }) {
  const { user } = useAuth();
  const { pathname } = useLocation();

  // Not logged in → send to login, remember where they were going
  if (!user) {
    return <Navigate to="/login" state={{ from: pathname }} replace />;
  }

  // Logged in but wrong role for this route
  const allowed = ROUTE_ROLES[pathname];
  if (allowed && !allowed.includes(user.role)) {
    const fallback = user.role === "receptionist" ? "/reception" : "/dashboard";
    return <Navigate to={fallback} replace />;
  }

  return children;
}
