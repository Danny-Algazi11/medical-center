import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Roles allowed per route — omit to allow any authenticated user.
// /admin/* is handled separately below (prefix match) so it also covers
// dynamic detail routes like /admin/doctors/:id and /admin/clinics/:id.
const ROUTE_ROLES = {
  "/reception": ["receptionist"],
  "/dashboard": ["doctor"],
  "/wallet": ["doctor"],
  "/profile": ["doctor"],
  "/schedule": ["doctor", "receptionist"],
  "/appointments": ["doctor", "receptionist"],
  "/patients": ["receptionist"],
  "/medical-records": ["doctor"],
  "/messages": ["doctor"],
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

  // Every /admin/* route (including detail pages like /admin/doctors/5)
  // requires the admin role — matched by prefix since ROUTE_ROLES only
  // does exact matches and can't express dynamic segments.
  const allowed = pathname.startsWith("/admin")
    ? ["admin"]
    : ROUTE_ROLES[pathname];
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
