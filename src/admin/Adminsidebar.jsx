import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "../i18n/useTranslation";
import "../components/styles/Admin.css";

const NAV = [
  {
    groupKey: "admin.groupOverview",
    items: [{ to: "/admin", icon: "ti-layout-dashboard", labelKey: "admin.dashboard" }],
  },
  {
    groupKey: "admin.groupManagement",
    items: [
      {
        to: "/admin/doctors",
        icon: "ti-stethoscope",
        labelKey: "admin.doctorManagement",
      },
      {
        to: "/admin/clinics",
        icon: "ti-building-hospital",
        labelKey: "admin.clinicManagement",
      },
    ],
  },
  {
    groupKey: "admin.groupReports",
    items: [
      { to: "/admin/complaints", icon: "ti-alert-circle", labelKey: "admin.complaints" },
      { to: "/admin/ratings", icon: "ti-star", labelKey: "admin.ratings" },
    ],
  },
  {
    groupKey: "admin.groupAnalytics",
    items: [
      { to: "/admin/analytics", icon: "ti-chart-bar", labelKey: "admin.analytics" },
      { to: "/admin/audit", icon: "ti-clipboard-list", labelKey: "admin.auditLogs" },
    ],
  },
];

export default function AdminSidebar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

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
        <div className="adm-logo-badge">{t("admin.portalBadge")}</div>
      </div>

      {/* Nav */}
      <nav className="adm-nav">
        {NAV.map(({ groupKey, items }) => (
          <div key={groupKey}>
            <div className="adm-nav-group">{t(groupKey)}</div>
            {items.map(({ to, icon, labelKey }) => (
              <Link
                key={to}
                to={to}
                className={`adm-nav-item${pathname === to ? " active" : ""}`}
              >
                <i className={`ti ${icon}`} aria-hidden="true" />
                {t(labelKey)}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="adm-sidebar-bottom">
        <Link to="/admin/settings" className="adm-nav-item">
          <i className="ti ti-settings" aria-hidden="true" /> {t("admin.settings")}
        </Link>
        <button className="adm-nav-item" onClick={handleLogout}>
          <i className="ti ti-logout" aria-hidden="true" /> {t("admin.logout")}
        </button>
        <div className="adm-sidebar-user">
          <div className="adm-sidebar-avatar">SA</div>
          <div>
            <div className="adm-sidebar-uname">{t("admin.superAdmin")}</div>
            <div className="adm-sidebar-urole">{t("admin.systemAdministrator")}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
