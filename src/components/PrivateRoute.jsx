import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Roles allowed per route — omit to allow any authenticated user
const ROUTE_ROLES = {
  "/reception": ["receptionist"],
  "/dashboard": ["doctor"],
};

export default function PrivateRoute({ children }) {
  const { user } = useAuth();
  const { pathname } = useLocation();

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
    const fallback = user.role === "receptionist" ? "/reception" : "/dashboard";
    return <Navigate to={fallback} replace />;
  }

  return children;
}
