import { useState, useEffect, useCallback } from "react";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";
import {
  getFinancialSummary,
  getPlatformWallet,
  getPlatformTransactions,
  getTopUpRequests,
  approveTopUp,
  rejectTopUp,
  getWithdrawalRequests,
  approveWithdrawal,
  rejectWithdrawal,
} from "../api/wallet";
import { useTranslation } from "../i18n/useTranslation";
import "../components/styles/Admin.css";

const STATUS_BADGE = {
  pending: "adm-badge-amber",
  approved: "adm-badge-green",
  rejected: "adm-badge-red",
};

const TX_TYPES = [
  "top_up",
  "withdrawal",
  "appointment_charge",
  "appointment_refund",
  "doctor_earning",
  "platform_fee",
  "admin_adjustment",
];

function formatLabel(value) {
  if (!value) return "—";
  return String(value)
    .split("_")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

function formatMoney(value) {
  const n = Number(value ?? 0);
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Shared request-slip modal for both top-up and withdrawal requests. Shows
// every field the backend actually returns (TopUpRequestResource /
// WithdrawalRequestResource are identical in shape) plus inline
// approve/reject controls when the request is still pending, so the admin
// doesn't have to close the slip and hunt for the row again to act on it.
function RequestSlipModal({ kind, request, busy, onApprove, onReject, onClose, t }) {
  const [rejectReason, setRejectReason] = useState("");
  const [rejecting, setRejecting] = useState(false);

  if (!request) return null;

  const kindLabel = kind === "top-up" ? t("wallet.slipTopUpTitle") : t("wallet.slipWithdrawalTitle");

  return (
    <div className="adm-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="adm-modal">
        <div className="adm-modal-header">
          <div>
            <h2>{kindLabel}</h2>
            <p>{t("wallet.slipSubtitle")} #{request.id}</p>
          </div>
          <button className="adm-icon-btn" onClick={onClose} aria-label="Close">
            <i className="ti ti-x" aria-hidden="true" />
          </button>
        </div>

        <div className="adm-modal-body">
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "14px 16px",
                borderRadius: 10,
                background: "var(--adm-bg-soft, #f7f7f5)",
              }}
            >
              <span style={{ fontSize: 13, color: "var(--adm-text-muted)" }}>{t("wallet.amount")}</span>
              <span style={{ fontSize: 22, fontWeight: 700 }}>${formatMoney(request.amount)}</span>
            </div>

            {[
              { label: t("wallet.user"), value: request.user_name || `#${request.user_id}` },
              {
                label: t("wallet.status"),
                value: (
                  <span className={`adm-badge ${STATUS_BADGE[request.status] || "adm-badge-gray"}`}>
                    {t(`wallet.${request.status}`) !== `wallet.${request.status}` ? t(`wallet.${request.status}`) : formatLabel(request.status)}
                  </span>
                ),
              },
              { label: t("wallet.requestedOn"), value: formatDateTime(request.created_at) },
              { label: t("wallet.processedOn"), value: formatDateTime(request.processed_at) },
              { label: t("wallet.adminNote"), value: request.admin_note || t("wallet.noAdminNote") },
            ].map((row) => (
              <div key={row.label} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <span style={{ fontSize: 13, color: "var(--adm-text-muted)" }}>{row.label}</span>
                <span style={{ fontSize: 13, fontWeight: 600, textAlign: "right" }}>{row.value}</span>
              </div>
            ))}

            {request.status === "pending" && (
              <div style={{ marginTop: 6, paddingTop: 14, borderTop: "1px solid var(--adm-card-border)" }}>
                {rejecting ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <label className="adm-label">{t("wallet.rejectReason")}</label>
                    <textarea
                      className="adm-textarea"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder={t("wallet.rejectReason")}
                    />
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        className="adm-btn adm-btn-red"
                        disabled={busy}
                        onClick={() => onReject(rejectReason)}
                      >
                        {t("wallet.confirmReject")}
                      </button>
                      <button className="adm-btn adm-btn-outline" onClick={() => setRejecting(false)}>
                        {t("wallet.cancel")}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="adm-btn adm-btn-green" disabled={busy} onClick={onApprove}>
                      {t("wallet.approve")}
                    </button>
                    <button className="adm-btn adm-btn-outline" disabled={busy} onClick={() => setRejecting(true)}>
                      {t("wallet.reject")}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// One request-list card (top-up or withdrawal) with a status filter and a
// row click that opens the slip modal. Both admin request tables share this
// exact shape, so a single parameterized component drives both instead of
// duplicating the table markup twice.
function RequestListCard({ kind, title, rows, loading, error, statusFilter, onStatusFilterChange, onOpenSlip, t }) {
  return (
    <div className="adm-card">
      <div className="adm-card-header">
        <h2 className="adm-card-title">{title}</h2>
        <select
          className="adm-input"
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          style={{ maxWidth: 160 }}
        >
          <option value="pending">{t("wallet.pending")}</option>
          <option value="approved">{t("wallet.approved")}</option>
          <option value="rejected">{t("wallet.rejected")}</option>
          <option value="">{t("wallet.allStatuses")}</option>
        </select>
      </div>
      {error && <div style={{ padding: 16, color: "#c00", fontSize: 13 }}>{error}</div>}
      {loading && (
        <div style={{ textAlign: "center", padding: "24px" }}>
          <p>{t("adminCommon.loading")}</p>
        </div>
      )}
      {!loading && (
        <table className="adm-table">
          <thead>
            <tr>
              <th>{t("wallet.user")}</th>
              <th>{t("wallet.amount")}</th>
              <th>{t("wallet.status")}</th>
              <th>{t("wallet.requestedOn")}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} style={{ cursor: "pointer" }} onClick={() => onOpenSlip(kind, r)}>
                <td style={{ fontSize: 13, fontWeight: 500 }}>{r.user_name || `#${r.user_id}`}</td>
                <td style={{ fontSize: 13, fontWeight: 500 }}>${formatMoney(r.amount)}</td>
                <td>
                  <span className={`adm-badge ${STATUS_BADGE[r.status] || "adm-badge-gray"}`}>
                    {t(`wallet.${r.status}`) !== `wallet.${r.status}` ? t(`wallet.${r.status}`) : formatLabel(r.status)}
                  </span>
                </td>
                <td style={{ fontSize: 12, color: "var(--adm-text-muted)" }}>{formatDateTime(r.created_at)}</td>
                <td style={{ textAlign: "right" }}>
                  <button
                    className="adm-btn adm-btn-outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenSlip(kind, r);
                    }}
                  >
                    {t("wallet.viewSlip")}
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: 24, color: "var(--adm-text-muted)" }}>
                  {t("wallet.noRequestsForFilter")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default function PaymentsPage() {
  const { t } = useTranslation();

  const [finance, setFinance] = useState(null);
  const [financeLoading, setFinanceLoading] = useState(true);
  const [financeError, setFinanceError] = useState("");

  const [platformWallet, setPlatformWallet] = useState(null);

  const [platformTx, setPlatformTx] = useState([]);
  const [platformTxLoading, setPlatformTxLoading] = useState(true);
  const [platformTxError, setPlatformTxError] = useState("");
  const [platformTxType, setPlatformTxType] = useState("");
  const [platformTxPage, setPlatformTxPage] = useState(1);
  const [platformTxLastPage, setPlatformTxLastPage] = useState(1);

  const [topUpStatus, setTopUpStatus] = useState("pending");
  const [topUps, setTopUps] = useState([]);
  const [topUpsLoading, setTopUpsLoading] = useState(true);
  const [topUpsError, setTopUpsError] = useState("");

  const [withdrawalStatus, setWithdrawalStatus] = useState("pending");
  const [withdrawals, setWithdrawals] = useState([]);
  const [withdrawalsLoading, setWithdrawalsLoading] = useState(true);
  const [withdrawalsError, setWithdrawalsError] = useState("");

  // { kind: "top-up" | "withdrawal", request } for the open slip modal.
  const [openSlip, setOpenSlip] = useState(null);
  const [slipBusy, setSlipBusy] = useState(false);

  const loadFinance = useCallback(async () => {
    setFinanceLoading(true);
    setFinanceError("");
    try {
      const [summaryRes, platformRes] = await Promise.all([getFinancialSummary(), getPlatformWallet()]);
      setFinance(summaryRes.data.data);
      setPlatformWallet(platformRes.data.data);
    } catch (err) {
      setFinanceError(err.message || "Failed to load financial summary.");
    } finally {
      setFinanceLoading(false);
    }
  }, []);

  const loadPlatformTx = useCallback(async (page, type) => {
    setPlatformTxLoading(true);
    setPlatformTxError("");
    try {
      const params = { per_page: 15, page };
      if (type) params.type = type;
      const res = await getPlatformTransactions(params);
      setPlatformTx((prev) => (page === 1 ? res.data.data || [] : [...prev, ...(res.data.data || [])]));
      setPlatformTxLastPage(res.data.meta?.last_page || 1);
    } catch (err) {
      setPlatformTxError(err.message || "Failed to load platform transactions.");
    } finally {
      setPlatformTxLoading(false);
    }
  }, []);

  const loadTopUps = useCallback(async (status) => {
    setTopUpsLoading(true);
    setTopUpsError("");
    try {
      const params = { per_page: 30 };
      if (status) params.status = status;
      const res = await getTopUpRequests(params);
      setTopUps(res.data.data || []);
    } catch (err) {
      setTopUpsError(err.message || "Failed to load top-up requests.");
    } finally {
      setTopUpsLoading(false);
    }
  }, []);

  const loadWithdrawals = useCallback(async (status) => {
    setWithdrawalsLoading(true);
    setWithdrawalsError("");
    try {
      const params = { per_page: 30 };
      if (status) params.status = status;
      const res = await getWithdrawalRequests(params);
      setWithdrawals(res.data.data || []);
    } catch (err) {
      setWithdrawalsError(err.message || "Failed to load withdrawal requests.");
    } finally {
      setWithdrawalsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFinance();
  }, [loadFinance]);

  useEffect(() => {
    setPlatformTxPage(1);
    loadPlatformTx(1, platformTxType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platformTxType]);

  useEffect(() => {
    loadTopUps(topUpStatus);
  }, [topUpStatus, loadTopUps]);

  useEffect(() => {
    loadWithdrawals(withdrawalStatus);
  }, [withdrawalStatus, loadWithdrawals]);

  function handleLoadMorePlatformTx() {
    const next = platformTxPage + 1;
    setPlatformTxPage(next);
    loadPlatformTx(next, platformTxType);
  }

  function refreshOpenSlipList() {
    if (openSlip?.kind === "top-up") loadTopUps(topUpStatus);
    if (openSlip?.kind === "withdrawal") loadWithdrawals(withdrawalStatus);
    loadFinance();
  }

  async function handleApproveSlip() {
    if (!openSlip) return;
    setSlipBusy(true);
    try {
      if (openSlip.kind === "top-up") {
        await approveTopUp(openSlip.request.id);
      } else {
        await approveWithdrawal(openSlip.request.id);
      }
      setOpenSlip(null);
      refreshOpenSlipList();
    } catch (err) {
      window.alert(err.message || "Action failed.");
    } finally {
      setSlipBusy(false);
    }
  }

  async function handleRejectSlip(reason) {
    if (!openSlip) return;
    setSlipBusy(true);
    try {
      if (openSlip.kind === "top-up") {
        await rejectTopUp(openSlip.request.id, reason || undefined);
      } else {
        await rejectWithdrawal(openSlip.request.id, reason || undefined);
      }
      setOpenSlip(null);
      refreshOpenSlipList();
    } catch (err) {
      window.alert(err.message || "Action failed.");
    } finally {
      setSlipBusy(false);
    }
  }

  return (
    <div className="adm-shell">
      <AdminSidebar />
      <div className="adm-main">
        <AdminTopbar title={t("wallet.paymentsTitle")} searchPlaceholder={t("adminCommon.searchDoctors")} />
        <div className="adm-content">
          <div className="adm-page-header">
            <div className="adm-page-header-left">
              <h1>{t("wallet.paymentsTitle")}</h1>
              <p>{t("wallet.paymentsSubtitle")}</p>
            </div>
          </div>

          {financeError && (
            <div style={{ padding: 12, color: "#c00", fontSize: 13, marginBottom: 16 }}>{financeError}</div>
          )}

          {!financeLoading && finance && (
            <div className="adm-stat-grid" style={{ marginBottom: 20, gridTemplateColumns: "repeat(5, 1fr)" }}>
              {[
                { label: t("wallet.platformBalance"), num: platformWallet?.balance ?? finance.platform_balance, icon: "ti-building-bank" },
                { label: t("wallet.totalFeesCollected"), num: finance.total_fees_collected, icon: "ti-receipt" },
                { label: t("wallet.totalPaidIn"), num: finance.total_paid_in, icon: "ti-credit-card" },
                { label: t("wallet.totalRefunded"), num: finance.total_refunded, icon: "ti-rotate" },
                { label: t("wallet.totalDoctorPayouts"), num: finance.total_doctor_payouts, icon: "ti-stethoscope" },
              ].map((s) => (
                <div className="adm-stat-card" key={s.label}>
                  <div>
                    <div className="adm-stat-label">{s.label}</div>
                    <div className="adm-stat-num">
                      {typeof s.num === "number" ? `$${s.num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}` : s.num}
                    </div>
                  </div>
                  <i className={`ti ${s.icon} adm-stat-icon`} aria-hidden="true" />
                </div>
              ))}
            </div>
          )}

          {financeLoading && (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <p>{t("wallet.loadingFinance")}</p>
            </div>
          )}

          <div className="adm-card" style={{ marginBottom: 20 }}>
            <div className="adm-card-header">
              <h2 className="adm-card-title">{t("wallet.platformTransactions")}</h2>
              <select
                className="adm-input"
                value={platformTxType}
                onChange={(e) => setPlatformTxType(e.target.value)}
                style={{ maxWidth: 200 }}
              >
                <option value="">{t("wallet.allTypes")}</option>
                {TX_TYPES.map((ty) => (
                  <option key={ty} value={ty}>
                    {formatLabel(ty)}
                  </option>
                ))}
              </select>
            </div>
            {platformTxError && (
              <div style={{ padding: 16, color: "#c00", fontSize: 13 }}>{platformTxError}</div>
            )}
            <table className="adm-table">
              <thead>
                <tr>
                  <th>{t("wallet.type")}</th>
                  <th>{t("wallet.amount")}</th>
                  <th>{t("wallet.balanceAfter")}</th>
                  <th>{t("wallet.description")}</th>
                  <th>{t("wallet.date")}</th>
                </tr>
              </thead>
              <tbody>
                {platformTxLoading && platformTx.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: 24, color: "var(--adm-text-muted)" }}>
                      {t("wallet.loadingTransactions")}
                    </td>
                  </tr>
                )}
                {!platformTxLoading && platformTx.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: 24, color: "var(--adm-text-muted)" }}>
                      {t("wallet.noPlatformTransactions")}
                    </td>
                  </tr>
                )}
                {platformTx.map((tx) => (
                  <tr key={tx.id}>
                    <td style={{ fontSize: 13, fontWeight: 500 }}>{formatLabel(tx.type)}</td>
                    <td style={{ fontSize: 13, fontWeight: 500, color: Number(tx.amount) < 0 ? "var(--adm-red)" : "var(--adm-green)" }}>
                      {Number(tx.amount) > 0 ? "+" : ""}
                      {formatMoney(tx.amount)}
                    </td>
                    <td style={{ fontSize: 13 }}>{formatMoney(tx.balance_after)}</td>
                    <td style={{ fontSize: 13 }}>{tx.description || "—"}</td>
                    <td style={{ fontSize: 12, color: "var(--adm-text-muted)" }}>{formatDateTime(tx.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {platformTxPage < platformTxLastPage && (
              <div style={{ padding: 16, textAlign: "center" }}>
                <button className="adm-btn adm-btn-outline" onClick={handleLoadMorePlatformTx} disabled={platformTxLoading}>
                  {platformTxLoading ? t("adminCommon.loading") : t("wallet.loadMore")}
                </button>
              </div>
            )}
          </div>

          <div className="adm-grid-2">
            <RequestListCard
              kind="top-up"
              title={t("wallet.topUpRequests")}
              rows={topUps}
              loading={topUpsLoading}
              error={topUpsError}
              statusFilter={topUpStatus}
              onStatusFilterChange={setTopUpStatus}
              onOpenSlip={(kind, r) => setOpenSlip({ kind, request: r })}
              t={t}
            />
            <RequestListCard
              kind="withdrawal"
              title={t("wallet.withdrawalRequests")}
              rows={withdrawals}
              loading={withdrawalsLoading}
              error={withdrawalsError}
              statusFilter={withdrawalStatus}
              onStatusFilterChange={setWithdrawalStatus}
              onOpenSlip={(kind, r) => setOpenSlip({ kind, request: r })}
              t={t}
            />
          </div>
        </div>
      </div>

      {openSlip && (
        <RequestSlipModal
          kind={openSlip.kind}
          request={openSlip.request}
          busy={slipBusy}
          onApprove={handleApproveSlip}
          onReject={handleRejectSlip}
          onClose={() => setOpenSlip(null)}
          t={t}
        />
      )}
    </div>
  );
}
