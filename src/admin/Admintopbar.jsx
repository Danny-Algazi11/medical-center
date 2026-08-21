import { useTranslation } from "../i18n/useTranslation";
import "../components/styles/Admin.css";

export default function AdminTopbar({ title, searchPlaceholder }) {
  const { t } = useTranslation();

  return (
    <header className="adm-topbar">
      <span className="adm-topbar-title">{title}</span>

      <div className="adm-topbar-search">
        <i className="ti ti-search" aria-hidden="true" />
        <input
          type="search"
          placeholder={searchPlaceholder || t("topbar.searchDefault")}
        />
      </div>

      <button className="adm-topbar-icon" aria-label={t("topbar.notifications")}>
        <i className="ti ti-bell" aria-hidden="true" />
        <span className="adm-topbar-badge" aria-hidden="true" />
      </button>
      <button className="adm-topbar-icon" aria-label={t("admin.settings")}>
        <i className="ti ti-settings" aria-hidden="true" />
      </button>
    </header>
  );
}
