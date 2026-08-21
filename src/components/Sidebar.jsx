import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "../i18n/useTranslation";
import "./styles/Layout.css";

const NAV_ITEMS = [
  {
    to: "/dashboard",
    icon: "ti-layout-dashboard",
    labelKey: "nav.dashboard",
    roles: ["doctor"],
  },
  {
    to: "/reception",
    icon: "ti-building-hospital",
    labelKey: "nav.reception",
    roles: ["receptionist"],
  },
  {
    to: "/profile",
    icon: "ti-user-circle",
    labelKey: "nav.profile",
    roles: ["doctor"],
  },
  {
    to: "/schedule",
    icon: "ti-calendar-week",
    labelKey: "nav.schedule",
    roles: ["doctor", "receptionist"],
  },
  {
    to: "/appointments",
    icon: "ti-calendar-event",
    labelKey: "nav.appointments",
    roles: ["doctor", "receptionist"],
  },
  {
    to: "/patients",
    icon: "ti-users",
    labelKey: "nav.patients",
    roles: ["receptionist"],
  },
  {
    to: "/medical-records",
    icon: "ti-report-medical",
    labelKey: "nav.medicalRecords",
    roles: ["doctor"],
  },
  { to: "/messages", icon: "ti-message-circle", labelKey: "nav.messages" },
  { to: "/settings", icon: "ti-settings", labelKey: "nav.settings" },
];

function initialsOf(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return `${first}${last}`.toUpperCase() || "?";
}

export default function Sidebar() {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const navItems = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(user?.role),
  );

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
        {t("nav.newAppointment")}
      </Link>

      {/* Nav */}
      <nav className="sidebar-nav">
        {navItems.map(({ to, icon, labelKey }) => (
          <Link
            key={to}
            to={to}
            className={`sidebar-nav-item${pathname.startsWith(to) ? " active" : ""}`}
          >
            <i className={`ti ${icon}`} aria-hidden="true" />
            {t(labelKey)}
          </Link>
        ))}
      </nav>

      {/* Bottom */}
      <div className="sidebar-bottom">
        <Link to="/support" className="sidebar-nav-item">
          <i className="ti ti-help-circle" aria-hidden="true" />
          {t("nav.support")}
        </Link>
        <button className="sidebar-nav-item" onClick={handleLogout}>
          <i className="ti ti-logout" aria-hidden="true" />
          {t("nav.logout")}
        </button>

        {/* Live user from auth context */}
        {user && (
          <div className="sidebar-user">
            <div className="sidebar-avatar">{initialsOf(user.full_name)}</div>
            <div>
              <div className="sidebar-user-name">{user.full_name}</div>
              <div className="sidebar-user-role">
                {user.role === "receptionist"
                  ? t("nav.roleReceptionist")
                  : t("nav.roleDoctor")}
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
