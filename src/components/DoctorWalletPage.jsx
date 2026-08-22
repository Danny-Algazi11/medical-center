import { useState, useEffect, useCallback, useMemo } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { useTranslation } from "../i18n/useTranslation";
import "./styles/Layout.css";
import "./styles/Appointments.css";
import {
  getDoctorWallet,
  getDoctorWalletTransactions,
  createWithdrawalRequest,
  getDoctorWithdrawalRequests,
} from "../api/wallet";

const STATUS_BADGE = {
  pending: "waiting",
  approved: "active",
  rejected: "cancelled",
};

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

function formatTypeLabel(type) {
  if (!type) return "—";
  return type
    .split("_")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

// Read-only "slip" for a single withdrawal request - every field the
// backend returns (WithdrawalRequestResource), formatted like a receipt.
// Doctors can't approve/reject their own requests (that's admin-only), so
// unlike the admin slip modal this one is purely informational.
function WithdrawalSlipModal({ request, onClose, t }) {
  if (!request) return null;
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <div>
            <h2>{t("wallet.slipWithdrawalTitle")}</h2>
            <p>{t("wallet.slipSubtitle")} #{request.id}</p>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <i className="ti ti-x" aria-hidden="true" />
          </button>
        </div>
        <div style={{ padding: "20px 28px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "14px 16px",
              borderRadius: 10,
              background: "var(--bg-soft, #f7f7f5)",
            }}
          >
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{t("wallet.amount")}</span>
            <span style={{ fontSize: 22, fontWeight: 700 }}>${formatMoney(request.amount)}</span>
          </div>

          {[
            {
              label: t("wallet.status"),
              value: (
                <span className={`badge badge-${STATUS_BADGE[request.status] || "scheduled"}`}>
                  {t(`wallet.${request.status}`) !== `wallet.${request.status}` ? t(`wallet.${request.status}`) : formatTypeLabel(request.status)}
                </span>
              ),
            },
            { label: t("wallet.requestedOn"), value: formatDateTime(request.created_at) },
            { label: t("wallet.processedOn"), value: formatDateTime(request.processed_at) },
            { label: t("wallet.adminNote"), value: request.admin_note || t("wallet.noAdminNote") },
          ].map((row) => (
            <div key={row.label} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{row.label}</span>
              <span style={{ fontSize: 13, fontWeight: 600, textAlign: "right" }}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DoctorWalletPage() {
  const { t } = useTranslation();

  const [wallet, setWallet] = useState(null);
  const [walletLoading, setWalletLoading] = useState(true);
  const [walletError, setWalletError] = useState("");

  const [transactions, setTransactions] = useState([]);
  const [txLoading, setTxLoading] = useState(true);
  const [txError, setTxError] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  // Unfiltered transaction snapshot (separate from the filterable table
  // above) used only to compute the lifetime earned/withdrawn stat cards,
  // so switching the table's type filter never skews the totals.
  const [statsTransactions, setStatsTransactions] = useState([]);

  const [requests, setRequests] = useState([]);
  const [reqLoading, setReqLoading] = useState(true);
  const [reqError, setReqError] = useState("");

  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const [openSlip, setOpenSlip] = useState(null);

  const loadWallet = useCallback(async () => {
    setWalletLoading(true);
    setWalletError("");
    try {
      const res = await getDoctorWallet();
      setWallet(res.data.data);
    } catch (err) {
      setWalletError(err.message || "Failed to load wallet.");
    } finally {
      setWalletLoading(false);
    }
  }, []);

  const loadTransactions = useCallback(async () => {
    setTxLoading(true);
    setTxError("");
    try {
      const params = { per_page: 50 };
      if (typeFilter) params.type = typeFilter;
      const res = await getDoctorWalletTransactions(params);
      setTransactions(res.data.data || []);
    } catch (err) {
      setTxError(err.message || "Failed to load transactions.");
    } finally {
      setTxLoading(false);
    }
  }, [typeFilter]);

  const loadStatsTransactions = useCallback(async () => {
    try {
      const res = await getDoctorWalletTransactions({ per_page: 200 });
      setStatsTransactions(res.data.data || []);
    } catch {
      // ✅ الإحصائيات ثانوية - لو فشل جلبها منضل عارضين الرصيد الأساسي
      // بدون ما نكسر الشاشة كلها بخطأ حرج.
    }
  }, []);

  const loadRequests = useCallback(async () => {
    setReqLoading(true);
    setReqError("");
    try {
      const res = await getDoctorWithdrawalRequests({ per_page: 20 });
      setRequests(res.data.data || []);
    } catch (err) {
      setReqError(err.message || "Failed to load withdrawal requests.");
    } finally {
      setReqLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWallet();
    loadRequests();
    loadStatsTransactions();
  }, [loadWallet, loadRequests, loadStatsTransactions]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  // Lifetime earned / withdrawn, derived client-side from statsTransactions
  // (no dedicated summary endpoint on the doctor side) - mirrors exactly
  // what the ledger rows themselves say, so it can never drift from the
  // transactions table below it.
  const { totalEarned, totalWithdrawn } = useMemo(() => {
    let earned = 0;
    let withdrawn = 0;
    for (const tx of statsTransactions) {
      const amt = Number(tx.amount) || 0;
      if (tx.type === "doctor_earning") earned += amt;
      if (tx.type === "withdrawal") withdrawn += Math.abs(amt);
    }
    return { totalEarned: earned, totalWithdrawn: withdrawn };
  }, [statsTransactions]);

  const pendingWithdrawalAmount = useMemo(
    () => requests.filter((r) => r.status === "pending").reduce((sum, r) => sum + (Number(r.amount) || 0), 0),
    [requests],
  );

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    const value = Number(amount);
    if (!amount || Number.isNaN(value) || value <= 0) {
      setFormError(t("wallet.insufficientBalanceHint"));
      return;
    }
    if (wallet && value > Number(wallet.balance)) {
      setFormError(t("wallet.insufficientBalanceHint"));
      return;
    }

    setSubmitting(true);
    try {
      await createWithdrawalRequest({ amount: value });
      setAmount("");
      setFormSuccess(t("wallet.submitRequest"));
      loadRequests();
    } catch (err) {
      setFormError(err.message || "Failed to submit withdrawal request.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="layout-shell">
      <Sidebar />

      <div className="layout-main">
        <Topbar searchPlaceholder={t("topbar.searchDefault")} />

        <main className="page-content">
          <div className="page-header">
            <div className="page-header-left">
              <h1>{t("wallet.title")}</h1>
            </div>
          </div>

          {walletError && <div className="apt-banner apt-banner-error">{walletError}</div>}

          <div className="stat-cards">
            <div className="stat-card">
              <div className="stat-card-icon teal">
                <i className="ti ti-wallet" aria-hidden="true" />
              </div>
              <div className="stat-card-num">
                {walletLoading ? "—" : formatMoney(wallet?.balance)}
              </div>
              <div className="stat-card-label">{t("wallet.currentBalance")}</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-icon green">
                <i className="ti ti-cash" aria-hidden="true" />
              </div>
              <div className="stat-card-num">
                {walletLoading ? "—" : formatMoney(wallet?.balance)}
              </div>
              <div className="stat-card-label">{t("wallet.availableToWithdraw")}</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-icon teal">
                <i className="ti ti-trending-up" aria-hidden="true" />
              </div>
              <div className="stat-card-num">{formatMoney(totalEarned)}</div>
              <div className="stat-card-label">{t("wallet.totalEarned")}</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-icon green">
                <i className="ti ti-arrow-down-circle" aria-hidden="true" />
              </div>
              <div className="stat-card-num">{formatMoney(totalWithdrawn)}</div>
              <div className="stat-card-label">{t("wallet.totalWithdrawn")}</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-icon teal">
                <i className="ti ti-hourglass" aria-hidden="true" />
              </div>
              <div className="stat-card-num">{formatMoney(pendingWithdrawalAmount)}</div>
              <div className="stat-card-label">{t("wallet.pendingWithdrawalAmount")}</div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="card-title">{t("wallet.requestWithdrawal")}</h2>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: "16px 20px", display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>
                  {t("wallet.withdrawalAmount")}
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--border-color, #ddd)",
                    minWidth: 200,
                  }}
                />
              </div>
              <button type="submit" className="btn-dark" disabled={submitting}>
                {submitting ? t("wallet.submitting") : t("wallet.submitRequest")}
              </button>
            </form>
            {formError && (
              <div style={{ padding: "0 20px 16px", color: "#c00", fontSize: 13 }}>{formError}</div>
            )}
            {formSuccess && !formError && (
              <div style={{ padding: "0 20px 16px", color: "var(--green)", fontSize: 13 }}>
                {formSuccess}
              </div>
            )}

            <table className="data-table">
              <thead>
                <tr>
                  <th>{t("wallet.amount")}</th>
                  <th>{t("wallet.status")}</th>
                  <th>{t("wallet.requestedOn")}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {reqLoading && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", padding: 24, color: "var(--text-muted)" }}>
                      {t("doctorDashboard.loading")}
                    </td>
                  </tr>
                )}
                {reqError && (
                  <tr>
                    <td colSpan={4} style={{ textAlign:"center", padding: 24, color: "#c00" }}>
                      {reqError}
                    </td>
                  </tr>
                )}
                {!reqLoading && !reqError && requests.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign:"center", padding: 24, color: "var(--text-muted)" }}>
                      {t("wallet.noWithdrawalRequests")}
                    </td>
                  </tr>
                )}
                {requests.map((r) => (
                  <tr key={r.id} style={{ cursor: "pointer" }} onClick={() => setOpenSlip(r)}>
                    <td>{formatMoney(r.amount)}</td>
                    <td>
                      <span className={`badge badge-${STATUS_BADGE[r.status] || "scheduled"}`}>
                        {t(`wallet.${r.status}`) !== `wallet.${r.status}` ? t(`wallet.${r.status}`) : formatTypeLabel(r.status)}
                      </span>
                    </td>
                    <td>{formatDateTime(r.created_at)}</td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        className="btn-outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenSlip(r);
                        }}
                      >
                        {t("wallet.viewSlip")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="card-title">{t("wallet.transactions")}</h2>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid var(--border-color, #ddd)" }}
              >
                <option value="">{t("wallet.allTypes")}</option>
                <option value="doctor_earning">{formatTypeLabel("doctor_earning")}</option>
                <option value="withdrawal">{formatTypeLabel("withdrawal")}</option>
              </select>
            </div>

            <table className="data-table">
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
                {txLoading && (
                  <tr>
                    <td colSpan={5} style={{ textAlign:"center", padding: 24, color: "var(--text-muted)" }}>
                      {t("wallet.loadingTransactions")}
                    </td>
                  </tr>
                )}
                {txError && (
                  <tr>
                    <td colSpan={5} style={{ textAlign:"center", padding: 24, color: "#c00" }}>
                      {txError}
                    </td>
                  </tr>
                )}
                {!txLoading && !txError && transactions.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign:"center", padding: 24, color: "var(--text-muted)" }}>
                      {t("wallet.noTransactions")}
                    </td>
                  </tr>
                )}
                {transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td>{formatTypeLabel(tx.type)}</td>
                    <td style={{ color: Number(tx.amount) < 0 ? "var(--red)" : "var(--green)" }}>
                      {Number(tx.amount) > 0 ? "+" : ""}
                      {formatMoney(tx.amount)}
                    </td>
                    <td>{formatMoney(tx.balance_after)}</td>
                    <td>{tx.description || "—"}</td>
                    <td>{formatDateTime(tx.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      {openSlip && <WithdrawalSlipModal request={openSlip} onClose={() => setOpenSlip(null)} t={t} />}
    </div>
  );
}
