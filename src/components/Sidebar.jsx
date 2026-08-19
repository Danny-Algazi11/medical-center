import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./styles/Layout.css";

const NAV_ITEMS = [
  { to: "/dashboard", icon: "ti-layout-dashboard", label: "Dashboard" },
  { to: "/profile", icon: "ti-user-circle", label: "Profile" },
  { to: "/schedule", icon: "ti-calendar-week", label: "Schedule" },
  { to: "/appointments", icon: "ti-calendar-event", label: "Appointments" },
  { to: "/patients", icon: "ti-users", label: "Patients" },
  { to: "/medical-records", icon: "ti-file-medical", label: "Medical Records" },
  { to: "/messages", icon: "ti-message-circle", label: "Messages" },
  { to: "/reception", icon: "ti-building-hospital", label: "Reception" },
  { to: "/settings", icon: "ti-settings", label: "Settings" },
];

export default function Sidebar() {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-name">St. Jude Medical</div>
        <div className="sidebar-logo-sub">City Central Branch</div>
      </div>

      {/* New Appointment */}
      <Link to="/appointments" className="sidebar-new-btn">
        <i className="ti ti-plus" aria-hidden="true" />
        New Appointment
      </Link>

      {/* Nav */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ to, icon, label }) => (
          <Link
            key={to}
            to={to}
            className={`sidebar-nav-item${pathname.startsWith(to) ? " active" : ""}`}
          >
            <i className={`ti ${icon}`} aria-hidden="true" />
            {label}
          </Link>
        ))}
      </nav>

      {/* Bottom */}
      <div className="sidebar-bottom">
        <Link to="/support" className="sidebar-nav-item">
          <i className="ti ti-help-circle" aria-hidden="true" />
          Support
        </Link>
        <button className="sidebar-nav-item" onClick={handleLogout}>
          <i className="ti ti-logout" aria-hidden="true" />
          Logout
        </button>

        {/* Live user from auth context */}
        {user && (
          <div className="sidebar-user">
            <div className="sidebar-avatar">{user.initials}</div>
            <div>
              <div className="sidebar-user-name">{user.name}</div>
              <div className="sidebar-user-role">
                {user.role === "receptionist" ? "Receptionist" : "Doctor"}
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
