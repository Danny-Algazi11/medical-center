import { Link, useLocation, useNavigate } from "react-router-dom";
import "../components/styles/Admin.css";

const NAV = [
  {
    group: "Overview",
    items: [{ to: "/admin", icon: "ti-layout-dashboard", label: "Dashboard" }],
  },
  {
    group: "Management",
    items: [
      {
        to: "/admin/doctors",
        icon: "ti-stethoscope",
        label: "Doctor management",
      },
      {
        to: "/admin/clinics",
        icon: "ti-building-hospital",
        label: "Clinic management",
      },
    ],
  },
  {
    group: "Reports",
    items: [
      { to: "/admin/complaints", icon: "ti-alert-circle", label: "Complaints" },
      { to: "/admin/ratings", icon: "ti-star", label: "Ratings" },
    ],
  },
  {
    group: "Analytics",
    items: [
      { to: "/admin/analytics", icon: "ti-chart-bar", label: "Analytics" },
      { to: "/admin/audit", icon: "ti-clipboard-list", label: "Audit logs" },
    ],
  },
];

export default function AdminSidebar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  function handleLogout() {
    // Standardized on localStorage + "token", matching axios.js's
    // interceptor (which reads localStorage.getItem("token")).
    localStorage.removeItem("token");
    navigate("/login", { replace: true });
  }

  return (
    <aside className="adm-sidebar">
      {/* Logo */}
      <div className="adm-logo">
        <div className="adm-logo-name">MediCenter</div>
        <div className="adm-logo-sub">Admin Portal</div>
        <div className="adm-logo-badge">SUPER ADMIN</div>
      </div>

      {/* Nav */}
      <nav className="adm-nav">
        {NAV.map(({ group, items }) => (
          <div key={group}>
            <div className="adm-nav-group">{group}</div>
            {items.map(({ to, icon, label }) => (
              <Link
                key={to}
                to={to}
                className={`adm-nav-item${pathname === to ? " active" : ""}`}
              >
                <i className={`ti ${icon}`} aria-hidden="true" />
                {label}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="adm-sidebar-bottom">
        <Link to="/admin/settings" className="adm-nav-item">
          <i className="ti ti-settings" aria-hidden="true" /> Settings
        </Link>
        <button className="adm-nav-item" onClick={handleLogout}>
          <i className="ti ti-logout" aria-hidden="true" /> Logout
        </button>
        <div className="adm-sidebar-user">
          <div className="adm-sidebar-avatar">SA</div>
          <div>
            <div className="adm-sidebar-uname">Super Admin</div>
            <div className="adm-sidebar-urole">System Administrator</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
