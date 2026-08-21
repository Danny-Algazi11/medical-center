import { useTranslation } from "../i18n/useTranslation";

export default function DocumentCard({ label, url, icon = "ti-file" }) {
  const { t } = useTranslation();
  const hasFile = Boolean(url);

  return (
    <a
      href={hasFile ? url : undefined}
      target={hasFile ? "_blank" : undefined}
      rel={hasFile ? "noreferrer" : undefined}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        padding: "16px 10px",
        border: "1px solid #eee",
        borderRadius: 10,
        textAlign: "center",
        textDecoration: "none",
        color: "inherit",
        background: hasFile ? "#fafafa" : "#f5f5f5",
        cursor: hasFile ? "pointer" : "default",
        opacity: hasFile ? 1 : 0.55,
      }}
      onClick={(e) => {
        if (!hasFile) e.preventDefault();
      }}
    >
      <i
        className={`ti ${icon}`}
        aria-hidden="true"
        style={{ fontSize: 26, color: hasFile ? "var(--adm-text-primary)" : "var(--adm-text-muted)" }}
      />
      <span style={{ fontSize: 12, fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 11, color: "var(--adm-text-muted)" }}>
        {hasFile ? t("adminCommon.viewFile") : t("adminCommon.notUploaded")}
      </span>
    </a>
  );
}
