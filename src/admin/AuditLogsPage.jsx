import { useState, useEffect, useCallback } from "react";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";
import { getAuditLogs } from "../api/admin";
import {
  formatAuditAction,
  formatEntityType,
  formatTimestamp,
  auditSeverity,
  SEVERITY_ICON,
  SEVERITY_BADGE,
} from "./auditFormat";
import { useTranslation } from "../i18n/useTranslation";
import "../components/styles/Admin.css";

// Entity types actually written by the backend's AuditLog::create() calls
// (App\Models\<X> — see DoctorVerificationService, ClinicService,
// ReceptionistVerificationService, DoctorReportService, AuthService,
// AppointmentBookingService/AppointmentStatusService).
const ENTITY_TYPES = [
  "All",
  "Doctor",
  "Clinic",
  "Receptionist",
  "DoctorReport",
  "Appointment",
  "User",
];

const SEVERITY_FILTERS = ["All", "Critical", "Warning", "Info", "Success"];
const SEVERITY_LABEL = { red: "Critical", amber: "Warning", blue: "Info", green: "Success", gray: "Info" };

const ICON_STYLE = {
  red: { bg: "var(--adm-red-l)", color: "var(--adm-red)" },
  green: { bg: "var(--adm-green-light)", color: "var(--adm-green)" },
  amber: { bg: "var(--adm-amb-l)", color: "var(--adm-amber)" },
  blue: { bg: "var(--adm-blue-l)", color: "var(--adm-blue)" },
  gray: { bg: "#f0f0f0", color: "#999" },
};

const ENTITY_KEYS = {
  All: "auditLogs.all",
  Doctor: "auditLogs.doctor",
  Clinic: "auditLogs.clinic",
  Receptionist: "auditLogs.receptionist",
  DoctorReport: "auditLogs.report",
  Appointment: "auditLogs.appointment",
  User: "auditLogs.user",
};

const SEVERITY_KEYS = {
  All: "auditLogs.all",
  Critical: "auditLogs.critical",
  Warning: "auditLogs.warning",
  Info: "auditLogs.info",
  Success: "auditLogs.success",
};

export default function AuditLogsPage() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [entityType, setEntityType] = useState("All");
  const [severity, setSeverity] = useState("All");
  const [search, setSearch] = useState("");

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = { page, per_page: 20 };
      if (entityType !== "All") params.entity_type = `App\\Models\\${entityType}`;

      const res = await getAuditLogs(params);
      setLogs(res.data.data || []);
      setMeta(res.data.meta || null);
    } catch (err) {
      setError(err.message || "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }, [page, entityType]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  useEffect(() => {
    setPage(1);
  }, [entityType]);

  const filtered = logs.filter((log) => {
    const sev = auditSeverity(log.action);
    const sOk = severity === "All" || SEVERITY_LABEL[sev] === severity;
    const q = search.trim().toLowerCase();
    const searchOk =
      q === "" ||
      formatAuditAction(log.action).toLowerCase().includes(q) ||
      formatEntityType(log.entity_type).toLowerCase().includes(q) ||
      String(log.entity_id).includes(q);
    return sOk && searchOk;
  });

  const counts = {
    total: meta?.total ?? logs.length,
    critical: logs.filter((l) => auditSeverity(l.action) === "red").length,
    warnings: logs.filter((l) => auditSeverity(l.action) === "amber").length,
    successful: logs.filter((l) => auditSeverity(l.action) === "green").length,
  };

  return (
    <div className="adm-shell">
      <AdminSidebar />
      <div className="adm-main">
        <AdminTopbar title={t("auditLogs.title")} searchPlaceholder={t("auditLogs.searchPlaceholder")} />
        <div className="adm-content">
          {/* Header */}
          <div className="adm-page-header">
            <div className="adm-page-header-left">
              <h1>{t("auditLogs.title")}</h1>
              <p>{t("auditLogs.subtitle")}</p>
            </div>
          </div>

          {error && (
            <div
              style={{
                padding: "12px 16px",
                background: "#fee",
                border: "1px solid #fcc",
                borderRadius: "8px",
                marginBottom: "16px",
                color: "#c00",
                fontSize: "13px",
              }}
            >
              {error}
            </div>
          )}

          {/* Stat cards — computed from the current page only (the API
              doesn't expose severity breakdowns), so these describe what's
              visible below, not necessarily the full log history. */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4,1fr)",
              gap: 14,
              marginBottom: 20,
            }}
          >
            {[
              {
                label: t("auditLogs.totalEntries"),
                num: counts.total,
                color: "var(--adm-text-primary)",
              },
              {
                label: t("auditLogs.criticalPage"),
                num: counts.critical,
                color: "var(--adm-red)",
              },
              {
                label: t("auditLogs.warningsPage"),
                num: counts.warnings,
                color: "var(--adm-amber)",
              },
              {
                label: t("auditLogs.successfulPage"),
                num: counts.successful,
                color: "var(--adm-green)",
              },
            ].map((s) => (
              <div className="adm-stat-card" key={s.label}>
                <div>
                  <div className="adm-stat-label">{s.label}</div>
                  <div className="adm-stat-num" style={{ color: s.color }}>
                    {s.num}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Search + filters */}
          <div className="adm-filter-bar" style={{ marginBottom: 16 }}>
            <div style={{ position: "relative", flex: 1, maxWidth: 280 }}>
              <i
                className="ti ti-search"
                style={{
                  position: "absolute",
                  left: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--adm-text-muted)",
                  fontSize: 15,
                }}
                aria-hidden="true"
              />
              <input
                className="adm-input"
                style={{ paddingLeft: 32 }}
                placeholder={t("auditLogs.searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <span
              style={{
                fontSize: 12,
                color: "var(--adm-text-muted)",
                fontWeight: 500,
              }}
            >
              {t("auditLogs.entity")}:
            </span>
            <select
              className="adm-filter-select"
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
            >
              {ENTITY_TYPES.map((m) => (
                <option key={m} value={m}>{t(ENTITY_KEYS[m])}</option>
              ))}
            </select>

            <span
              style={{
                fontSize: 12,
                color: "var(--adm-text-muted)",
                fontWeight: 500,
              }}
            >
              {t("auditLogs.severity")}:
            </span>
            <select
              className="adm-filter-select"
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
            >
              {SEVERITY_FILTERS.map((s) => (
                <option key={s} value={s}>{t(SEVERITY_KEYS[s])}</option>
              ))}
            </select>

            <button
              className="adm-btn adm-btn-outline"
              onClick={() => {
                setEntityType("All");
                setSeverity("All");
                setSearch("");
              }}
            >
              <i className="ti ti-refresh" aria-hidden="true" /> {t("auditLogs.reset")}
            </button>
          </div>

          {loading && (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <p>{t("auditLogs.loadingLogs")}</p>
            </div>
          )}

          {/* Logs table */}
          {!loading && (
            <div className="adm-card">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>{t("auditLogs.action")}</th>
                    <th>{t("auditLogs.entity")}</th>
                    <th>{t("auditLogs.admin")}</th>
                    <th>{t("auditLogs.severity")}</th>
                    <th>{t("auditLogs.timestamp")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((log) => {
                    const sev = auditSeverity(log.action);
                    return (
                      <tr key={log.id}>
                        <td>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                            }}
                          >
                            <div
                              style={{
                                width: 30,
                                height: 30,
                                borderRadius: 7,
                                flexShrink: 0,
                                background: ICON_STYLE[sev].bg,
                                color: ICON_STYLE[sev].color,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 15,
                              }}
                            >
                              <i
                                className={`ti ${SEVERITY_ICON[sev]}`}
                                aria-hidden="true"
                              />
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 500 }}>
                              {formatAuditAction(log.action)}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className="adm-badge adm-badge-gray">
                            {formatEntityType(log.entity_type)} #{log.entity_id}
                          </span>
                        </td>
                        <td
                          style={{
                            fontSize: 12,
                            color: "var(--adm-text-secondary)",
                          }}
                        >
                          {log.user_id ? `#${log.user_id}` : t("auditLogs.system")}
                        </td>
                        <td>
                          <span className={`adm-badge ${SEVERITY_BADGE[sev]}`}>
                            {t(SEVERITY_KEYS[SEVERITY_LABEL[sev]])}
                          </span>
                        </td>
                        <td
                          style={{
                            fontSize: 11,
                            color: "var(--adm-text-muted)",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {formatTimestamp(log.created_at)}
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        style={{
                          textAlign: "center",
                          padding: "32px",
                          color: "var(--adm-text-muted)",
                        }}
                      >
                        {t("auditLogs.noLogsMatch")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div className="adm-table-footer">
                <span>
                  {t("auditLogs.showing")} {filtered.length} {t("auditLogs.of")} {logs.length} {t("auditLogs.loaded")}
                  {meta ? ` (${t("auditLogs.page")} ${meta.current_page} ${t("auditLogs.of")} ${meta.last_page}, ${meta.total} ${t("auditLogs.total")})` : ""}
                </span>
                <div className="adm-pagination">
                  <button
                    className="adm-page-btn"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={!meta || meta.current_page <= 1}
                  >
                    <i className="ti ti-chevron-left" />
                  </button>
                  <button className="adm-page-btn active">
                    {meta?.current_page ?? 1}
                  </button>
                  <button
                    className="adm-page-btn"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!meta || meta.current_page >= meta.last_page}
                  >
                    <i className="ti ti-chevron-right" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
