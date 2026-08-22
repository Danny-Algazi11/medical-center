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

    </header>
  );
}
