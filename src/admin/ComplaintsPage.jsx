import { useState, useEffect, useCallback } from "react";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";
import { getReports, markReportUnderReview, resolveReport } from "../api/admin";
import { formatTimestamp } from "./auditFormat";
import { useTranslation } from "../i18n/useTranslation";
import "../components/styles/Admin.css";

// Real values from App\Core\Enums\ReportCategory
const CATEGORY_FILTER = [
  "All",
  "misconduct",
  "negligence",
  "fraud",
  "verbal_abuse",
  "privacy_violation",
  "other",
];
// Real values from App\Core\Enums\ReportStatus
const STATUS_FILTER = [
  "All",
  "pending",
  "under_review",
  "action_taken",
  "resolved",
  "dismissed",
];

function fallbackLabel(value) {
  if (!value) return "—";
  return value
    .split("_")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

const CATEGORY_KEYS = {
  misconduct: "complaints.misconduct",
  negligence: "complaints.negligence",
  fraud: "complaints.fraud",
  verbal_abuse: "complaints.verbalAbuse",
  privacy_violation: "complaints.privacyViolation",
  other: "complaints.other",
};

const STATUS_KEYS = {
  pending: "complaints.pending",
  under_review: "complaints.underReview",
  action_taken: "complaints.actionTaken",
  resolved: "complaints.resolved",
  dismissed: "complaints.dismissed",
};

function formatCategory(value, t) {
  return value && CATEGORY_KEYS[value] ? t(CATEGORY_KEYS[value]) : fallbackLabel(value);
}
function formatStatus(value, t) {
  return value && STATUS_KEYS[value] ? t(STATUS_KEYS[value]) : fallbackLabel(value);
}

function statusBadgeClass(status) {
  const map = {
    pending: "adm-badge-red",
    under_review: "adm-badge-amber",
    action_taken: "adm-badge-teal",
    resolved: "adm-badge-green",
    dismissed: "adm-badge-gray",
  };
  return map[status] || "adm-badge-gray";
}

export default function ComplaintsPage() {
  const { t } = useTranslation();
  const [reports, setReports] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [category, setCategory] = useState("All");
  const [status, setStatus] = useState("All");
  const [selected, setSelected] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = { per_page: 50 };
      if (category !== "All") params.category = category;
      if (status !== "All") params.status = status;

      const res = await getReports(params);
      setReports(res.data.data || []);
      setMeta(res.data.meta || null);
    } catch (err) {
      setError(err.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, [category, status]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  function applyUpdate(reportId, updated) {
    setReports((prev) =>
      prev.map((r) => (r.id === reportId ? { ...r, ...updated } : r)),
    );
    setSelected((prev) => (prev?.id === reportId ? { ...prev, ...updated } : prev));
  }

  async function handleMarkUnderReview(reportId) {
    setActionLoading(true);
    setError("");
    try {
      const res = await markReportUnderReview(reportId);
      applyUpdate(reportId, res.data.data);
    } catch (err) {
      setError(err.message || "Failed to update report");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleResolve(reportId, finalStatus) {
    const admin_notes = window.prompt(
      `Notes for marking this report "${formatStatus(finalStatus, t)}" (optional):`,
    );
    if (admin_notes === null) return;
    const admin_action =
      finalStatus === "action_taken"
        ? window.prompt("What action was taken against the doctor? (optional):") || undefined
        : undefined;

    setActionLoading(true);
    setError("");
    try {
      const res = await resolveReport(reportId, {
        status: finalStatus,
        admin_notes: admin_notes || undefined,
        admin_action,
      });
      applyUpdate(reportId, res.data.data);
    } catch (err) {
      setError(err.message || "Failed to resolve report");
    } finally {
      setActionLoading(false);
    }
  }

  const openCount = reports.filter((r) => r.status === "pending").length;
  const reviewingCount = reports.filter((r) => r.status === "under_review").length;
  const closedCount = reports.filter((r) =>
    ["action_taken", "resolved", "dismissed"].includes(r.status),
  ).length;

  return (
    <div className="adm-shell">
      <AdminSidebar />
      <div className="adm-main">
        <AdminTopbar
          title={t("complaints.title")}
          searchPlaceholder={t("adminCommon.searchDoctors")}
        />
        <div className="adm-content">
          {/* Header */}
          <div className="adm-page-header">
            <div className="adm-page-header-left">
              <h1>{t("complaints.title")}</h1>
              <p>{t("complaints.subtitle")}</p>
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

          {openCount > 0 && (
            <div className="adm-alert adm-alert-red">
              <i
                className="ti ti-alert-triangle"
                style={{ fontSize: 18, flexShrink: 0 }}
                aria-hidden="true"
              />
              <div>
                <strong>
                  {openCount} {openCount === 1 ? t("complaints.pendingReport") : t("complaints.pendingReports")}
                </strong>{" "}
                {openCount === 1 ? t("complaints.requiresReview") : t("complaints.requireReview")}
              </div>
            </div>
          )}

          {/* Stat cards */}
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
                label: t("complaints.total"),
                num: meta?.total ?? reports.length,
                color: "var(--adm-text-primary)",
              },
              {
                label: t("complaints.pending"),
                num: openCount,
                color: "var(--adm-red)",
              },
              {
                label: t("complaints.underReview"),
                num: reviewingCount,
                color: "var(--adm-amber)",
              },
              {
                label: t("complaints.closed"),
                num: closedCount,
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

          {/* Filter bar */}
          <div className="adm-filter-bar">
            <span
              style={{ fontSize: 12, color: "var(--adm-text-muted)", fontWeight: 500 }}
            >
              {t("complaints.category")}:
            </span>
            <select
              className="adm-filter-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORY_FILTER.map((c) => (
                <option key={c} value={c}>
                  {c === "All" ? t("adminCommon.all") : formatCategory(c, t)}
                </option>
              ))}
            </select>
            <span
              style={{
                fontSize: 12,
                color: "var(--adm-text-muted)",
                fontWeight: 500,
                marginLeft: 8,
              }}
            >
              {t("complaints.status")}:
            </span>
            <select
              className="adm-filter-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {STATUS_FILTER.map((s) => (
                <option key={s} value={s}>
                  {s === "All" ? t("adminCommon.all") : formatStatus(s, t)}
                </option>
              ))}
            </select>
          </div>

          {loading && (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <p>{t("complaints.loadingReports")}</p>
            </div>
          )}

          {/* Two-col: table + detail panel */}
          {!loading && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: selected ? "1fr 360px" : "1fr",
                gap: 16,
                transition: "all 0.2s",
              }}
            >
              {/* Table */}
              <div className="adm-card">
                <table className="adm-table">
                  <thead>
                    <tr>
                      <th>{t("complaints.report")}</th>
                      <th>{t("complaints.doctor")}</th>
                      <th>{t("complaints.patient")}</th>
                      <th>{t("complaints.date")}</th>
                      <th>{t("complaints.status")}</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((r) => (
                      <tr
                        key={r.id}
                        style={{
                          cursor: "pointer",
                          background: selected?.id === r.id ? "#f0f7f2" : "",
                        }}
                        onClick={() =>
                          setSelected((prev) => (prev?.id === r.id ? null : r))
                        }
                      >
                        <td>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 500,
                              color: "var(--adm-text-primary)",
                            }}
                          >
                            {formatCategory(r.category, t)}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: "var(--adm-text-muted)",
                              maxWidth: 260,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {r.description}
                          </div>
                        </td>
                        <td
                          style={{ fontSize: 12, color: "var(--adm-text-secondary)" }}
                        >
                          {r.doctor?.name || "—"}
                        </td>
                        <td>
                          <div style={{ fontSize: 12, fontWeight: 500 }}>
                            {r.patient?.name || "—"}
                          </div>
                        </td>
                        <td style={{ fontSize: 12, color: "var(--adm-text-muted)" }}>
                          {formatTimestamp(r.created_at)}
                        </td>
                        <td>
                          <span className={`adm-badge ${statusBadgeClass(r.status)}`}>
                            {formatStatus(r.status, t)}
                          </span>
                        </td>
                        <td>
                          <button
                            className="adm-icon-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelected((prev) => (prev?.id === r.id ? null : r));
                            }}
                          >
                            <i className="ti ti-chevron-right" aria-hidden="true" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {reports.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ textAlign: "center", padding: 24 }}>
                          {t("complaints.noReportsMatch")}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <div className="adm-table-footer">
                  <span>
                    {t("complaints.showing")} {reports.length} {t("complaints.of")} {meta?.total ?? reports.length} {t("complaints.reports")}
                  </span>
                </div>
              </div>

              {/* Detail panel */}
              {selected && (
                <div
                  className="adm-card"
                  style={{ height: "fit-content", position: "sticky", top: 86 }}
                >
                  <div className="adm-card-header">
                    <h2 className="adm-card-title">{t("complaints.reportDetail")}</h2>
                    <button className="adm-icon-btn" onClick={() => setSelected(null)}>
                      <i className="ti ti-x" aria-hidden="true" />
                    </button>
                  </div>

                  <div
                    style={{
                      padding: "16px 18px",
                      borderBottom: "1px solid var(--adm-card-border)",
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}
                    >
                      <span className={`adm-badge ${statusBadgeClass(selected.status)}`}>
                        {formatStatus(selected.status, t)}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 600,
                        color: "var(--adm-text-primary)",
                        marginBottom: 4,
                      }}
                    >
                      {formatCategory(selected.category, t)}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--adm-text-muted)" }}>
                      {t("complaints.filed")} {formatTimestamp(selected.created_at)}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: "14px 18px",
                      borderBottom: "1px solid var(--adm-card-border)",
                    }}
                  >
                    <div className="adm-info-row">
                      <span className="adm-info-label">{t("complaints.doctor")}</span>
                      <span className="adm-info-value">{selected.doctor?.name || "—"}</span>
                    </div>
                    <div className="adm-info-row">
                      <span className="adm-info-label">{t("complaints.patient")}</span>
                      <span className="adm-info-value">{selected.patient?.name || "—"}</span>
                    </div>
                    {selected.reviewed_at && (
                      <div className="adm-info-row">
                        <span className="adm-info-label">{t("complaints.reviewed")}</span>
                        <span className="adm-info-value">
                          {formatTimestamp(selected.reviewed_at)}
                        </span>
                      </div>
                    )}
                    {selected.resolved_at && (
                      <div className="adm-info-row">
                        <span className="adm-info-label">{t("complaints.resolved")}</span>
                        <span className="adm-info-value">
                          {formatTimestamp(selected.resolved_at)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      padding: "14px 18px",
                      borderBottom: "1px solid var(--adm-card-border)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: "var(--adm-text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        marginBottom: 8,
                      }}
                    >
                      {t("complaints.description")}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: "var(--adm-text-secondary)",
                        lineHeight: 1.65,
                        fontWeight: 300,
                      }}
                    >
                      {selected.description}
                    </div>
                  </div>

                  {(selected.admin_action || selected.admin_notes) && (
                    <div
                      style={{
                        padding: "14px 18px",
                        borderBottom: "1px solid var(--adm-card-border)",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: "var(--adm-text-muted)",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          marginBottom: 8,
                        }}
                      >
                        {t("complaints.adminResolution")}
                      </div>
                      {selected.admin_action && (
                        <div style={{ fontSize: 13, marginBottom: 4 }}>
                          <strong>{t("complaints.action")}</strong> {selected.admin_action}
                        </div>
                      )}
                      {selected.admin_notes && (
                        <div style={{ fontSize: 13, color: "var(--adm-text-secondary)" }}>
                          {selected.admin_notes}
                        </div>
                      )}
                    </div>
                  )}

                  {!["action_taken", "resolved", "dismissed"].includes(selected.status) && (
                    <div style={{ padding: "14px 18px" }}>
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: "var(--adm-text-muted)",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          marginBottom: 10,
                        }}
                      >
                        {t("complaints.takeAction")}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {selected.status === "pending" && (
                          <button
                            className="adm-btn adm-btn-amber"
                            style={{ justifyContent: "flex-start" }}
                            disabled={actionLoading}
                            onClick={() => handleMarkUnderReview(selected.id)}
                          >
                            <i className="ti ti-search" aria-hidden="true" /> {t("complaints.markUnderReview")}
                          </button>
                        )}
                        <button
                          className="adm-btn adm-btn-dark"
                          style={{ justifyContent: "flex-start" }}
                          disabled={actionLoading}
                          onClick={() => handleResolve(selected.id, "action_taken")}
                        >
                          <i className="ti ti-gavel" aria-hidden="true" /> {t("complaints.resolveActionTaken")}
                        </button>
                        <button
                          className="adm-btn adm-btn-green"
                          style={{ justifyContent: "flex-start" }}
                          disabled={actionLoading}
                          onClick={() => handleResolve(selected.id, "resolved")}
                        >
                          <i className="ti ti-circle-check" aria-hidden="true" /> {t("complaints.markResolved")}
                        </button>
                        <button
                          className="adm-btn adm-btn-outline"
                          style={{ justifyContent: "flex-start" }}
                          disabled={actionLoading}
                          onClick={() => handleResolve(selected.id, "dismissed")}
                        >
                          <i className="ti ti-x" aria-hidden="true" /> {t("complaints.dismiss")}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
