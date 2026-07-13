import "../components/styles/Admin.css";

export default function AdminTopbar({
  title,
  searchPlaceholder = "Search...",
}) {
  return (
    <header className="adm-topbar">
      <span className="adm-topbar-title">{title}</span>

      <div className="adm-topbar-search">
        <i className="ti ti-search" aria-hidden="true" />
        <input type="search" placeholder={searchPlaceholder} />
      </div>

      <button className="adm-topbar-icon" aria-label="Notifications">
        <i className="ti ti-bell" aria-hidden="true" />
        <span className="adm-topbar-badge" aria-hidden="true" />
      </button>
      <button className="adm-topbar-icon" aria-label="Settings">
        <i className="ti ti-settings" aria-hidden="true" />
      </button>
    </header>
  );
}
