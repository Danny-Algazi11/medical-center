import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./styles/Layout.css";

export default function Topbar({ tabs, searchPlaceholder = "Search..." }) {
  const { pathname } = useLocation();
  const { user } = useAuth();

  return (
    <header className="topbar">
      <span className="topbar-title">Clinic Management System</span>

      {tabs && (
        <nav className="topbar-tabs">
          {tabs.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`topbar-tab${pathname.startsWith(to) ? " active" : ""}`}
            >
              {label}
            </Link>
          ))}
        </nav>
      )}

      <div className="topbar-search">
        <i className="ti ti-search" aria-hidden="true" />
        <input type="search" placeholder={searchPlaceholder} />
      </div>

      <div className="topbar-icons">
        <button className="topbar-icon-btn" aria-label="Notifications">
          <i className="ti ti-bell" aria-hidden="true" />
          <span className="topbar-badge" aria-hidden="true" />
        </button>
        <button className="topbar-icon-btn" aria-label="Messages">
          <i className="ti ti-mail" aria-hidden="true" />
        </button>
      </div>

      {user && (
        <div className="topbar-user">
          <div>
            <div className="topbar-user-name">{user.name}</div>
            <div className="topbar-user-role">
              {user.role === "receptionist"
                ? "Head Receptionist"
                : "Doctor Portal"}
            </div>
          </div>
          <div className="topbar-avatar">{user.initials}</div>
        </div>
      )}
    </header>
  );
}
