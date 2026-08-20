import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useClinic } from "../context/ClinicContext";
import "./styles/Layout.css";

function initialsOf(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return `${first}${last}`.toUpperCase() || "?";
}

export default function Topbar({ tabs, searchPlaceholder = "Search..." }) {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const { clinics, selectedClinicId, setSelectedClinicId } = useClinic();

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

      {clinics.length > 0 && (
        <div className="topbar-clinic">
          <i className="ti ti-building-hospital" aria-hidden="true" />
          <select
            value={selectedClinicId || ""}
            onChange={(e) => setSelectedClinicId(Number(e.target.value))}
            aria-label="Selected clinic"
          >
            {clinics.map((c) => (
              <option key={c.clinic_id} value={c.clinic_id}>
                {c.clinic_name}
              </option>
            ))}
          </select>
        </div>
      )}

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
            <div className="topbar-user-name">{user.full_name}</div>
            <div className="topbar-user-role">
              {user.role === "receptionist"
                ? "Head Receptionist"
                : "Doctor Portal"}
            </div>
          </div>
          <div className="topbar-avatar">{initialsOf(user.full_name)}</div>
        </div>
      )}
    </header>
  );
}
