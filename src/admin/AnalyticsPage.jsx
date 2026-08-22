import { useState, useEffect, useCallback } from "react";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";
import {
  getAnalyticsDashboard,
  getDoctorPerformance,
  getUserEngagement,
  getAuditLogs,
} from "../api/admin";
import {
  getFinancialSummary,
  getTopUpRequests,
  approveTopUp,
  rejectTopUp,
  getWithdrawalRequests,
  approveWithdrawal,
  rejectWithdrawal,
} from "../api/wallet";
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

function formatLabel(value) {
  if (!value) return "—";
  return value
    .split("_")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

const ICON_STYLE = {
  red: { bg: "var(--adm-red-l)", color: "var(--adm-red)" },
  green: { bg: "var(--adm-green-light)", color: "var(--adm-green)" },
  amber: { bg: "var(--adm-amb-l)", color: "var(--adm-amber)" },
  blue: { bg: "var(--adm-blue-l)", color: "var(--adm-blue)" },
  gray: { bg: "#f0f0f0", color: "#999" },
};

// { pending: 3, completed: 12, ... } -> sorted bar rows
function StatusBreakdown({ byStatus, total, t }) {
  const entries = Object.entries(byStatus || {}).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) {
    return (
      <div style={{ padding: 18, fontSize: 12, color: "var(--adm-text-muted)" }}>
        {t("analytics.noDataYet")}
      </div>
    );
  }
  return (
    <div style={{ padding: "8px 0" }}>
      {entries.map(([status, count]) => {
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
          <div key={status} className="adm-metric-row">
            <div className="adm-metric-label">{formatLabel(status)}</div>
            <div className="adm-bar-wrap">
              <div className="adm-bar" style={{ width: `${pct}%` }} />
            </div>
            <div className="adm-metric-val">{count}</div>
            <div style={{ fontSize: 11, color: "var(--adm-text-muted)", width: 32, textAlign: "right" }}>
              {pct}%
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function AnalyticsPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState("overview");

  const [dashboard, setDashboard] = useState(null);
  const [dashLoading, setDashLoading] = useState(true);
  const [dashError, setDashError] = useState("");

  const [performance, setPerformance] = useState([]);
  const [perfLoading, setPerfLoading] = useState(false);
  const [perfError, setPerfError] = useState("");

  const [engagementFrom, setEngagementFrom] = useState("");
  const [engagementTo, setEngagementTo] = useState("");
  const [engagement, setEngagement] = useState(null);
  const [engLoading, setEngLoading] = useState(false);
  const [engError, setEngError] = useState("");

  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState("");

  const [finance, setFinance] = useState(null);
  const [financeLoading, setFinanceLoading] = useState(false);
  const [financeError, setFinanceError] = useState("");

  const [topUps, setTopUps] = useState([]);
  const [topUpsLoading, setTopUpsLoading] = useState(false);
  const [topUpsError, setTopUpsError] = useState("");

  const [withdrawals, setWithdrawals] = useState([]);
  const [withdrawalsLoading, setWithdrawalsLoading] = useState(false);
  const [withdrawalsError, setWithdrawalsError] = useState("");

  // { kind: "top-up" | "withdrawal", id } while a reject reason is being typed
  const [rejecting, setRejecting] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionBusyId, setActionBusyId] = useState(null);

  const loadDashboard = useCallback(async () => {
    setDashLoading(true);
    setDashError("");
    try {
      const res = await getAnalyticsDashboard();
      setDashboard(res.data.data);
    } catch (err) {
      setDashError(err.message || "Failed to load analytics dashboard");
    } finally {
      setDashLoading(false);
    }
  }, []);

  const loadPerformance = useCallback(async () => {
    setPerfLoading(true);
    setPerfError("");
    try {
      const res = await getDoctorPerformance({ per_page: 50 });
      setPerformance(res.data.data || []);
    } catch (err) {
      setPerfError(err.message || "Failed to load doctor performance");
    } finally {
      setPerfLoading(false);
    }
  }, []);

  const loadEngagement = useCallback(async () => {
    setEngLoading(true);
    setEngError("");
    try {
      const params = {};
      if (engagementFrom) params.from = engagementFrom;
      if (engagementTo) params.to = engagementTo;
      const res = await getUserEngagement(params);
      setEngagement(res.data.data);
    } catch (err) {
      setEngError(err.message || "Failed to load user engagement");
    } finally {
      setEngLoading(false);
    }
  }, [engagementFrom, engagementTo]);

  const loadLogs = useCallback(async () => {
    setLogsLoading(true);
    setLogsError("");
    try {
      const res = await getAuditLogs({ per_page: 15 });
      setLogs(res.data.data || []);
    } catch (err) {
      setLogsError(err.message || "Failed to load audit logs");
    } finally {
      setLogsLoading(false);
    }
  }, []);

  const loadFinance = useCallback(async () => {
    setFinanceLoading(true);
    setFinanceError("");
    try {
      const res = await getFinancialSummary();
      setFinance(res.data.data);
    } catch (err) {
      setFinanceError(err.message || "Failed to load financial summary");
    } finally {
      setFinanceLoading(false);
    }
  }, []);

  const loadTopUps = useCallback(async () => {
    setTopUpsLoading(true);
    setTopUpsError("");
    try {
      const res = await getTopUpRequests({ status: "pending", per_page: 20 });
      setTopUps(res.data.data || []);
    } catch (err) {
      setTopUpsError(err.message || "Failed to load top-up requests");
    } finally {
      setTopUpsLoading(false);
    }
  }, []);

  const loadWithdrawals = useCallback(async () => {
    setWithdrawalsLoading(true);
    setWithdrawalsError("");
    try {
      const res = await getWithdrawalRequests({ status: "pending", per_page: 20 });
      setWithdrawals(res.data.data || []);
    } catch (err) {
      setWithdrawalsError(err.message || "Failed to load withdrawal requests");
    } finally {
      setWithdrawalsLoading(false);
    }
  }, []);

  function startReject(kind, id) {
    setRejecting({ kind, id });
    setRejectReason("");
  }

  function cancelReject() {
    setRejecting(null);
    setRejectReason("");
  }

  async function handleApprove(kind, id) {
    setActionBusyId(id);
    try {
      if (kind === "top-up") {
        await approveTopUp(id);
        loadTopUps();
      } else {
        await approveWithdrawal(id);
        loadWithdrawals();
      }
      loadFinance();
    } catch (err) {
      window.alert(err.message || "Action failed.");
    } finally {
      setActionBusyId(null);
    }
  }

  async function handleReject() {
    if (!rejecting) return;
    const { kind, id } = rejecting;
    setActionBusyId(id);
    try {
      if (kind === "top-up") {
        await rejectTopUp(id, rejectReason || undefined);
        loadTopUps();
      } else {
        await rejectWithdrawal(id, rejectReason || undefined);
        loadWithdrawals();
      }
      loadFinance();
      cancelReject();
    } catch (err) {
      window.alert(err.message || "Action failed.");
    } finally {
      setActionBusyId(null);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    if (tab === "doctor performance" && performance.length === 0 && !perfLoading) {
      loadPerformance();
    }
    if (tab === "user engagement" && engagement === null && !engLoading) {
      loadEngagement();
    }
    if (tab === "audit logs" && logs.length === 0 && !logsLoading) {
      loadLogs();
    }
    if (tab === "finance" && finance === null && !financeLoading) {
      loadFinance();
      loadTopUps();
      loadWithdrawals();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const appts = dashboard?.appointments;
  const reports = dashboard?.reports;

  const TABS = [
    { key: "overview", label: t("analytics.overview") },
    { key: "doctor performance", label: t("analytics.doctorPerformance") },
    { key: "user engagement", label: t("analytics.userEngagement") },
    { key: "finance", label: t("admin.finance") },
    { key: "audit logs", label: t("analytics.auditLogs") },
  ];

  return (
    <div className="adm-shell">
      <AdminSidebar />
      <div className="adm-main">
        <AdminTopbar title={t("analytics.title")} searchPlaceholder={t("adminCommon.searchDoctors")} />
        <div className="adm-content">
          {/* Header */}
          <div className="adm-page-header">
            <div className="adm-page-header-left">
              <h1>{t("analytics.dashboardTitle")}</h1>
              <p>{t("analytics.subtitle")}</p>
            </div>
          </div>

          {dashError && (
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
              {dashError}
            </div>
          )}

          {/* Top stat cards */}
          {!dashLoading && dashboard && (
            <div className="adm-stat-grid" style={{ marginBottom: 20, gridTemplateColumns: "repeat(4, 1fr)" }}>
              {[
                {
                  label: t("analytics.totalAppointments"),
                  num: appts?.total ?? 0,
                  sub: t("analytics.allTime"),
                  icon: "ti-calendar-event",
                },
                {
                  label: t("analytics.totalReports"),
                  num: reports?.total ?? 0,
                  sub: `${reports?.pending_count ?? 0} ${t("analytics.pending")}`,
                  icon: "ti-flag",
                },
                {
                  label: t("analytics.newPatients"),
                  num: dashboard?.user_engagement?.new_patients ?? 0,
                  sub: t("analytics.last30Days"),
                  icon: "ti-users",
                },
                {
                  label: t("analytics.newDoctors"),
                  num: dashboard?.user_engagement?.new_doctors ?? 0,
                  sub: t("analytics.last30Days"),
                  icon: "ti-stethoscope",
                },
              ].map((s) => (
                <div className="adm-stat-card" key={s.label}>
                  <div>
                    <div className="adm-stat-label">{s.label}</div>
                    <div className="adm-stat-num">{s.num}</div>
                    <div className="adm-stat-sub">{s.sub}</div>
                  </div>
                  <i className={`ti ${s.icon} adm-stat-icon`} aria-hidden="true" />
                </div>
              ))}
            </div>
          )}

          {dashLoading && (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <p>{t("analytics.loadingAnalytics")}</p>
            </div>
          )}

          {/* Tabs */}
          <div className="adm-tabs">
            {TABS.map((tb) => (
              <button
                key={tb.key}
                className={`adm-tab${tab === tb.key ? " active" : ""}`}
                onClick={() => setTab(tb.key)}
                style={{ textTransform: "capitalize" }}
              >
                {tb.label}
              </button>
            ))}
          </div>

          {/* ── Overview tab ── */}
          {tab === "overview" && !dashLoading && dashboard && (
            <div className="adm-grid-2">
              <div className="adm-card">
                <div className="adm-card-header">
                  <h2 className="adm-card-title">{t("analytics.appointmentsByStatus")}</h2>
                </div>
                <StatusBreakdown byStatus={appts?.by_status} total={appts?.total} t={t} />
              </div>

              <div className="adm-card">
                <div className="adm-card-header">
                  <h2 className="adm-card-title">{t("analytics.reportsByStatus")}</h2>
                </div>
                <StatusBreakdown byStatus={reports?.by_status} total={reports?.total} t={t} />
              </div>
            </div>
          )}

          {/* ── Doctor performance tab ── */}
          {tab === "doctor performance" && (
            <div className="adm-card">
              {perfError && (
                <div style={{ padding: 16, color: "#c00", fontSize: 13 }}>{perfError}</div>
              )}
              {perfLoading && (
                <div style={{ textAlign: "center", padding: "40px" }}>
                  <p>{t("analytics.loadingPerformance")}</p>
                </div>
              )}
              {!perfLoading && (
                <table className="adm-table">
                  <thead>
                    <tr>
                      <th>{t("ratings.doctor")}</th>
                      <th>{t("analytics.completedAppointments")}</th>
                      <th>{t("analytics.rating")}</th>
                      <th>{t("analytics.totalReviews")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {performance.map((d) => (
                      <tr key={d.doctor_id}>
                        <td>
                          <div className="adm-cell">
                            <div className="adm-avatar">
                              {(d.name || "D").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
                            </div>
                            <div className="adm-cell-name">Dr. {d.name || "Unknown"}</div>
                          </div>
                        </td>
                        <td style={{ fontSize: 13, fontWeight: 500 }}>{d.completed_appointments}</td>
                        <td>
                          {d.average_rating != null ? (
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ color: "#f59e0b" }}>★</span>
                              <span style={{ fontSize: 13, fontWeight: 600 }}>{d.average_rating}</span>
                            </div>
                          ) : (
                            <span style={{ fontSize: 12, color: "var(--adm-text-muted)" }}>{t("analytics.noRatings")}</span>
                          )}
                        </td>
                        <td style={{ fontSize: 13, fontWeight: 500 }}>{d.total_reviews}</td>
                      </tr>
                    ))}
                    {performance.length === 0 && (
                      <tr>
                        <td colSpan={4} style={{ textAlign: "center", padding: 24 }}>
                          {t("analytics.noPerformanceData")}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* ── User engagement tab ── */}
          {tab === "user engagement" && (
            <div>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-end", marginBottom: 16 }}>
                <div className="adm-field" style={{ margin: 0 }}>
                  <label className="adm-label">{t("analytics.from")}</label>
                  <input
                    type="date"
                    className="adm-input"
                    value={engagementFrom}
                    onChange={(e) => setEngagementFrom(e.target.value)}
                  />
                </div>
                <div className="adm-field" style={{ margin: 0 }}>
                  <label className="adm-label">{t("analytics.to")}</label>
                  <input
                    type="date"
                    className="adm-input"
                    value={engagementTo}
                    onChange={(e) => setEngagementTo(e.target.value)}
                  />
                </div>
                <button className="adm-btn adm-btn-dark" onClick={loadEngagement} disabled={engLoading}>
                  {engLoading ? `${t("adminCommon.loading")}` : t("analytics.apply")}
                </button>
              </div>

              {engError && (
                <div style={{ padding: 12, color: "#c00", fontSize: 13 }}>{engError}</div>
              )}

              {engagement && (
                <div className="adm-grid-2">
                  {[
                    { label: t("analytics.newPatients"), value: engagement.new_patients, icon: "ti-users" },
                    { label: t("analytics.newDoctors"), value: engagement.new_doctors, icon: "ti-stethoscope" },
                    { label: t("analytics.newReceptionists"), value: engagement.new_receptionists, icon: "ti-user" },
                  ].map((u) => (
                    <div className="adm-stat-card" key={u.label}>
                      <div>
                        <div className="adm-stat-label">{u.label}</div>
                        <div className="adm-stat-num">{u.value}</div>
                        <div style={{ fontSize: 12, marginTop: 4, color: "var(--adm-text-muted)" }}>
                          {engagementFrom || engagementTo
                            ? `${engagementFrom || "…"} → ${engagementTo || "now"}`
                            : t("analytics.allTime")}
                        </div>
                      </div>
                      <i className={`ti ${u.icon} adm-stat-icon`} aria-hidden="true" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Finance tab ── */}
          {tab === "finance" && (
            <div>
              {financeError && (
                <div style={{ padding: 12, color: "#c00", fontSize: 13 }}>{financeError}</div>
              )}

              {financeLoading && (
                <div style={{ textAlign: "center", padding: "40px" }}>
                  <p>{t("wallet.loadingFinance")}</p>
                </div>
              )}

              {!financeLoading && finance && (
                <>
                  <div className="adm-page-header" style={{ marginBottom: 12 }}>
                    <div className="adm-page-header-left">
                      <h2 style={{ margin: 0, fontSize: 16 }}>{t("wallet.financeTitle")}</h2>
                      <p style={{ margin: 0 }}>{t("wallet.financeSubtitle")}</p>
                    </div>
                  </div>

                  <div className="adm-stat-grid" style={{ marginBottom: 20, gridTemplateColumns: "repeat(3, 1fr)" }}>
                    {[
                      { label: t("wallet.platformBalance"), num: finance.platform_balance, icon: "ti-building-bank" },
                      { label: t("wallet.totalFeesCollected"), num: finance.total_fees_collected, icon: "ti-receipt" },
                      { label: t("wallet.totalPaidIn"), num: finance.total_paid_in, icon: "ti-credit-card" },
                      { label: t("wallet.totalRefunded"), num: finance.total_refunded, icon: "ti-rotate" },
                      { label: t("wallet.totalDoctorPayouts"), num: finance.total_doctor_payouts, icon: "ti-stethoscope" },
                      {
                        label: t("wallet.pendingTopUps"),
                        num: finance.pending_top_up_requests?.count ?? 0,
                        sub: formatLabel(String(finance.pending_top_up_requests?.amount ?? 0)),
                        icon: "ti-arrow-up-circle",
                      },
                    ].map((s) => (
                      <div className="adm-stat-card" key={s.label}>
                        <div>
                          <div className="adm-stat-label">{s.label}</div>
                          <div className="adm-stat-num">
                            {typeof s.num === "number" ? s.num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : s.num}
                          </div>
                        </div>
                        <i className={`ti ${s.icon} adm-stat-icon`} aria-hidden="true" />
                      </div>
                    ))}
                  </div>

                  <div className="adm-card" style={{ marginBottom: 20 }}>
                    <div className="adm-card-header">
                      <h2 className="adm-card-title">{t("wallet.paymentsByStatus")}</h2>
                    </div>
                    <StatusBreakdown
                      byStatus={finance.payments_by_status}
                      total={Object.values(finance.payments_by_status || {}).reduce((a, b) => a + b, 0)}
                      t={t}
                    />
                  </div>

                  <div className="adm-grid-2">
                    <div className="adm-card">
                      <div className="adm-card-header">
                        <h2 className="adm-card-title">{t("wallet.pendingTopUps")}</h2>
                      </div>
                      {topUpsError && (
                        <div style={{ padding: 16, color: "#c00", fontSize: 13 }}>{topUpsError}</div>
                      )}
                      {topUpsLoading && (
                        <div style={{ textAlign: "center", padding: "24px" }}>
                          <p>{t("adminCommon.loading")}</p>
                        </div>
                      )}
                      {!topUpsLoading && (
                        <table className="adm-table">
                          <thead>
                            <tr>
                              <th>{t("wallet.user")}</th>
                              <th>{t("wallet.amount")}</th>
                              <th></th>
                            </tr>
                          </thead>
                          <tbody>
                            {topUps.map((r) => (
                              <tr key={r.id}>
                                <td style={{ fontSize: 13, fontWeight: 500 }}>{r.user_name || r.user_id}</td>
                                <td style={{ fontSize: 13, fontWeight: 500 }}>{r.amount}</td>
                                <td>
                                  {rejecting?.kind === "top-up" && rejecting.id === r.id ? (
                                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                      <input
                                        className="adm-input"
                                        placeholder={t("wallet.rejectReason")}
                                        value={rejectReason}
                                        onChange={(e) => setRejectReason(e.target.value)}
                                        style={{ minWidth: 120 }}
                                      />
                                      <button className="adm-btn adm-btn-red" onClick={handleReject} disabled={actionBusyId === r.id}>
                                        {t("wallet.confirmReject")}
                                      </button>
                                      <button className="adm-btn adm-btn-outline" onClick={cancelReject}>
                                        {t("wallet.cancel")}
                                      </button>
                                    </div>
                                  ) : (
                                    <div style={{ display: "flex", gap: 6 }}>
                                      <button
                                        className="adm-btn adm-btn-green"
                                        onClick={() => handleApprove("top-up", r.id)}
                                        disabled={actionBusyId === r.id}
                                      >
                                        {t("wallet.approve")}
                                      </button>
                                      <button
                                        className="adm-btn adm-btn-outline"
                                        onClick={() => startReject("top-up", r.id)}
                                        disabled={actionBusyId === r.id}
                                      >
                                        {t("wallet.reject")}
                                      </button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            ))}
                            {topUps.length === 0 && (
                              <tr>
                                <td colSpan={3} style={{ textAlign: "center", padding: 24 }}>
                                  {t("wallet.noTopUpRequestsAdmin")}
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      )}
                    </div>

                    <div className="adm-card">
                      <div className="adm-card-header">
                        <h2 className="adm-card-title">{t("wallet.pendingWithdrawals")}</h2>
                      </div>
                      {withdrawalsError && (
                        <div style={{ padding: 16, color: "#c00", fontSize: 13 }}>{withdrawalsError}</div>
                      )}
                      {withdrawalsLoading && (
                        <div style={{ textAlign: "center", padding: "24px" }}>
                          <p>{t("adminCommon.loading")}</p>
                        </div>
                      )}
                      {!withdrawalsLoading && (
                        <table className="adm-table">
                          <thead>
                            <tr>
                              <th>{t("wallet.user")}</th>
                              <th>{t("wallet.amount")}</th>
                              <th></th>
                            </tr>
                          </thead>
                          <tbody>
                            {withdrawals.map((r) => (
                              <tr key={r.id}>
                                <td style={{ fontSize: 13, fontWeight: 500 }}>{r.user_name || r.user_id}</td>
                                <td style={{ fontSize: 13, fontWeight: 500 }}>{r.amount}</td>
                                <td>
                                  {rejecting?.kind === "withdrawal" && rejecting.id === r.id ? (
                                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                      <input
                                        className="adm-input"
                                        placeholder={t("wallet.rejectReason")}
                                        value={rejectReason}
                                        onChange={(e) => setRejectReason(e.target.value)}
                                        style={{ minWidth: 120 }}
                                      />
                                      <button className="adm-btn adm-btn-red" onClick={handleReject} disabled={actionBusyId === r.id}>
                                        {t("wallet.confirmReject")}
                                      </button>
                                      <button className="adm-btn adm-btn-outline" onClick={cancelReject}>
                                        {t("wallet.cancel")}
                                      </button>
                                    </div>
                                  ) : (
                                    <div style={{ display: "flex", gap: 6 }}>
                                      <button
                                        className="adm-btn adm-btn-green"
                                        onClick={() => handleApprove("withdrawal", r.id)}
                                        disabled={actionBusyId === r.id}
                                      >
                                        {t("wallet.approve")}
                                      </button>
                                      <button
                                        className="adm-btn adm-btn-outline"
                                        onClick={() => startReject("withdrawal", r.id)}
                                        disabled={actionBusyId === r.id}
                                      >
                                        {t("wallet.reject")}
                                      </button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            ))}
                            {withdrawals.length === 0 && (
                              <tr>
                                <td colSpan={3} style={{ textAlign: "center", padding: 24 }}>
                                  {t("wallet.noWithdrawalRequestsAdmin")}
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Audit logs tab ── */}
          {tab === "audit logs" && (
            <div className="adm-card">
              <div className="adm-card-header">
                <h2 className="adm-card-title">{t("analytics.recentAuditLogs")}</h2>
                <span style={{ fontSize: 12, color: "var(--adm-text-muted)" }}>{t("analytics.mostRecent15")}</span>
              </div>
              {logsError && (
                <div style={{ padding: 16, color: "#c00", fontSize: 13 }}>{logsError}</div>
              )}
              {logsLoading && (
                <div style={{ textAlign: "center", padding: "40px" }}>
                  <p>{t("auditLogs.loadingLogs")}</p>
                </div>
              )}
              {!logsLoading && (
                <table className="adm-table">
                  <thead>
                    <tr>
                      <th>{t("auditLogs.action")}</th>
                      <th>{t("auditLogs.entity")}</th>
                      <th>{t("auditLogs.timestamp")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => {
                      const sev = auditSeverity(log.action);
                      return (
                        <tr key={log.id}>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                              <div
                                style={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: 7,
                                  background: ICON_STYLE[sev].bg,
                                  color: ICON_STYLE[sev].color,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: 14,
                                  flexShrink: 0,
                                }}
                              >
                                <i className={`ti ${SEVERITY_ICON[sev]}`} aria-hidden="true" />
                              </div>
                              <span style={{ fontSize: 13, fontWeight: 500 }}>
                                {formatAuditAction(log.action)}
                              </span>
                            </div>
                          </td>
                          <td>
                            <span className={`adm-badge ${SEVERITY_BADGE[sev]}`}>
                              {formatEntityType(log.entity_type)} #{log.entity_id}
                            </span>
                          </td>
                          <td style={{ fontSize: 11, color: "var(--adm-text-muted)" }}>
                            {formatTimestamp(log.created_at)}
                          </td>
                        </tr>
                      );
                    })}
                    {logs.length === 0 && (
                      <tr>
                        <td colSpan={3} style={{ textAlign: "center", padding: 24 }}>
                          {t("analytics.noAuditEntries")}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
