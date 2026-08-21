import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";
import { useTranslation } from "../i18n/useTranslation";
import {
  getClinics,
  createClinic,
  approveClinic,
  rejectClinic,
  suspendClinic,
  reactivateClinic,
} from "../api/admin";
import "../components/styles/Admin.css";

// The collection only confirms GET /admin/clinics (all) and
// GET /admin/clinics/pending — there's no documented ?status= filter for
// clinics (unlike doctors). So we fetch the full list once and filter
// client-side rather than guessing at an unconfirmed query param.
const STATUS_OPTIONS = ["All", "Pending", "Active", "Rejected", "Suspended"];

function getStatusColor(status) {
  const map = {
    pending: "amber",
    active: "green",
    rejected: "red",
    suspended: "red",
  };
  return map[status] || "gray";
}

function getStatusLabel(status) {
  const map = {
    pending: "Pending",
    active: "Active",
    rejected: "Rejected",
    suspended: "Suspended",
  };
  return map[status] || "Unknown";
}

function mapClinic(c) {
  return {
    id: c.id,
    name: c.name,
    phone: c.phone || "N/A",
    address: c.address || "N/A",
    owner: c.owner?.name || "—",
    apiStatus: c.status,
    status: getStatusColor(c.status),
    sLabel: getStatusLabel(c.status),
    // Raw API record — passed to the detail page on row click so it
    // can render instantly without a second fetch.
    raw: c,
  };
}

const MODAL_INIT = { name: "", phone: "", address: "", latitude: "", longitude: "" };

export default function ClinicManagement() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(MODAL_INIT);
  const [actionLoading, setActionLoading] = useState(null);

  const loadClinics = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getClinics();
      setClinics((res.data.data || []).map(mapClinic));
    } catch (err) {
      setError(err.message || "Failed to load clinics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClinics();
  }, [loadClinics]);

  const filtered = useMemo(
    () =>
      filter === "All"
        ? clinics
        : clinics.filter((c) => c.sLabel === filter),
    [clinics, filter],
  );

  const counts = useMemo(
    () => ({
      total: clinics.length,
      active: clinics.filter((c) => c.apiStatus === "active").length,
      pending: clinics.filter((c) => c.apiStatus === "pending").length,
      suspended: clinics.filter((c) => c.apiStatus === "suspended").length,
    }),
    [clinics],
  );

  function goToClinic(c) {
    navigate(`/admin/clinics/${c.id}`, { state: { clinic: c.raw } });
  }

  function handleChange(e) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  async function handleAdd(e) {
    e.preventDefault();
    setActionLoading("add");
    setError("");
    try {
      // Matches the "create clinic" request body exactly: name, phone,
      // address, latitude, longitude. No manager/capacity fields exist
      // on the backend, so they were dropped from this form.
      await createClinic({
        name: form.name,
        phone: form.phone,
        address: form.address,
        latitude: form.latitude || undefined,
        longitude: form.longitude || undefined,
      });
      setForm(MODAL_INIT);
      setShowModal(false);
      await loadClinics();
    } catch (err) {
      setError(err.message || "Failed to add clinic");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleApprove(id) {
    setActionLoading(id);
    setError("");
    try {
      await approveClinic(id);
      await loadClinics();
    } catch (err) {
      setError(err.message || "Failed to approve clinic");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(id) {
    const reason = window.prompt("Reason for rejecting this clinic:");
    if (reason === null) return;
    setActionLoading(id);
    setError("");
    try {
      await rejectClinic(id, reason);
      await loadClinics();
    } catch (err) {
      setError(err.message || "Failed to reject clinic");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleSuspend(id) {
    const reason = window.prompt("Reason for suspending this clinic:");
    if (reason === null) return;
    setActionLoading(id);
    setError("");
    try {
      await suspendClinic(id, reason);
      await loadClinics();
    } catch (err) {
      setError(err.message || "Failed to suspend clinic");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReactivate(id) {
    const reason =
      window.prompt("Reason for reactivating this clinic (optional):") || "";
    setActionLoading(id);
    setError("");
    try {
      await reactivateClinic(id, reason);
      await loadClinics();
    } catch (err) {
      setError(err.message || "Failed to reactivate clinic");
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="adm-shell">
      <AdminSidebar />
      <div className="adm-main">
        <AdminTopbar
          title={t("admin.clinicManagement")}
          searchPlaceholder={t("adminCommon.searchClinics")}
        />
        <div className="adm-content">
          <div className="adm-page-header">
            <div className="adm-page-header-left">
              <h1>{t("clinicManagement.title")}</h1>
              <p>{t("clinicManagement.subtitle")}</p>
            </div>
            <div className="adm-header-actions">
              <button
                type="button"
                className="adm-btn adm-btn-dark"
                onClick={() => setShowModal(true)}
              >
                <i className="ti ti-building-plus" aria-hidden="true" /> {t("clinicManagement.newClinic")}
              </button>
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
                label: t("clinicManagement.totalClinics"),
                num: counts.total,
                color: "var(--adm-text-primary)",
              },
              {
                label: t("adminCommon.active"),
                num: counts.active,
                color: "var(--adm-green)",
              },
              {
                label: t("adminCommon.pending"),
                num: counts.pending,
                color: "var(--adm-amber)",
              },
              {
                label: t("adminCommon.suspended"),
                num: counts.suspended,
                color: "var(--adm-red)",
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

          <div className="adm-filter-bar">
            {STATUS_OPTIONS.map((f) => (
              <button
                key={f}
                className={`adm-btn ${filter === f ? "adm-btn-dark" : "adm-btn-outline"}`}
                style={{ padding: "6px 14px", fontSize: 12 }}
                onClick={() => setFilter(f)}
              >
                {f === "All"
                  ? t("adminCommon.all")
                  : f === "Pending"
                    ? t("adminCommon.pending")
                    : f === "Active"
                      ? t("adminCommon.active")
                      : f === "Rejected"
                        ? t("adminCommon.rejected")
                        : t("adminCommon.suspended")}
              </button>
            ))}
          </div>

          {loading && (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <p>{t("clinicManagement.loadingClinics")}</p>
            </div>
          )}

          {!loading && (
            <div className="adm-card">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>{t("clinicManagement.clinic")}</th>
                    <th>{t("clinicManagement.address")}</th>
                    <th>{t("clinicManagement.owner")}</th>
                    <th>{t("clinicManagement.status")}</th>
                    <th style={{ textAlign: "right" }}>{t("clinicManagement.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length > 0 ? (
                    filtered.map((c) => (
                      <tr
                        key={c.id}
                        onClick={() => goToClinic(c)}
                        style={{ cursor: "pointer" }}
                        title="View clinic profile"
                      >
                        <td>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>
                            {c.name}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: "var(--adm-text-muted)",
                            }}
                          >
                            {c.phone}
                          </div>
                        </td>
                        <td
                          style={{
                            fontSize: 12,
                            color: "var(--adm-text-secondary)",
                          }}
                        >
                          {c.address}
                        </td>
                        <td
                          style={{
                            fontSize: 12,
                            color: "var(--adm-text-secondary)",
                          }}
                        >
                          {c.owner}
                        </td>
                        <td>
                          <span className={`adm-badge adm-badge-${c.status}`}>
                            {c.sLabel}
                          </span>
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              justifyContent: "flex-end",
                            }}
                          >
                            {c.apiStatus === "pending" && (
                              <>
                                <button
                                  className="adm-btn adm-btn-green"
                                  style={{ padding: "5px 10px", fontSize: 11 }}
                                  onClick={() => handleApprove(c.id)}
                                  disabled={actionLoading === c.id}
                                >
                                  {actionLoading === c.id ? "..." : t("adminCommon.approve")}
                                </button>
                                <button
                                  className="adm-btn adm-btn-red"
                                  style={{ padding: "5px 10px", fontSize: 11 }}
                                  onClick={() => handleReject(c.id)}
                                  disabled={actionLoading === c.id}
                                >
                                  {actionLoading === c.id ? "..." : t("adminCommon.reject")}
                                </button>
                              </>
                            )}
                            {c.apiStatus === "active" && (
                              <button
                                className="adm-btn adm-btn-amber"
                                style={{ padding: "5px 10px", fontSize: 11 }}
                                onClick={() => handleSuspend(c.id)}
                                disabled={actionLoading === c.id}
                              >
                                {actionLoading === c.id ? "..." : t("adminCommon.suspend")}
                              </button>
                            )}
                            {c.apiStatus === "suspended" && (
                              <button
                                className="adm-btn adm-btn-green"
                                style={{ padding: "5px 10px", fontSize: 11 }}
                                onClick={() => handleReactivate(c.id)}
                                disabled={actionLoading === c.id}
                              >
                                {actionLoading === c.id
                                  ? "..."
                                  : t("adminCommon.reactivate")}
                              </button>
                            )}
                            {c.apiStatus === "rejected" && (
                              <span
                                style={{
                                  fontSize: 11,
                                  color: "var(--adm-text-muted)",
                                }}
                              >
                                {t("clinicManagement.noActionsAvailable")}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="5"
                        style={{ textAlign: "center", padding: "20px" }}
                      >
                        {t("clinicManagement.noClinicsFound")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div className="adm-table-footer">
                <span>{t("clinicManagement.showing")} {filtered.length} {t("clinicManagement.of")} {clinics.length} {t("clinicManagement.totalClinics")}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div
          className="adm-modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="adm-modal">
            <div className="adm-modal-header">
              <div>
                <h2>{t("clinicManagement.createNewClinic")}</h2>
                <p>{t("clinicManagement.createClinicDesc")}</p>
              </div>
              <button
                type="button"
                className="adm-icon-btn"
                onClick={() => setShowModal(false)}
                aria-label="Close"
              >
                <i className="ti ti-x" aria-hidden="true" />
              </button>
            </div>
            <form onSubmit={handleAdd}>
              <div className="adm-modal-body">
                <div className="adm-field">
                  <label htmlFor="clinic-name" className="adm-label">
                    {t("clinicManagement.clinicName")}
                  </label>
                  <input
                    id="clinic-name"
                    className="adm-input"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="West Side Clinic"
                    required
                  />
                </div>
                <div className="adm-field">
                  <label htmlFor="clinic-phone" className="adm-label">
                    {t("clinicManagement.phone")}
                  </label>
                  <input
                    id="clinic-phone"
                    className="adm-input"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+1 212-555-0000"
                  />
                </div>
                <div className="adm-field">
                  <label htmlFor="clinic-address" className="adm-label">
                    {t("clinicManagement.address2")}
                  </label>
                  <input
                    id="clinic-address"
                    className="adm-input"
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="123 Main Street"
                    required
                  />
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 12,
                  }}
                >
                  <div className="adm-field">
                    <label htmlFor="clinic-lat" className="adm-label">
                      {t("clinicManagement.latitudeOptional")}
                    </label>
                    <input
                      id="clinic-lat"
                      className="adm-input"
                      name="latitude"
                      value={form.latitude}
                      onChange={handleChange}
                      placeholder="35.5138"
                    />
                  </div>
                  <div className="adm-field">
                    <label htmlFor="clinic-lng" className="adm-label">
                      {t("clinicManagement.longitudeOptional")}
                    </label>
                    <input
                      id="clinic-lng"
                      className="adm-input"
                      name="longitude"
                      value={form.longitude}
                      onChange={handleChange}
                      placeholder="30.5138"
                    />
                  </div>
                </div>
              </div>
              <div className="adm-modal-footer">
                <button
                  type="button"
                  className="adm-btn adm-btn-outline"
                  onClick={() => setShowModal(false)}
                >
                  {t("adminCommon.cancel")}
                </button>
                <button
                  type="submit"
                  className="adm-btn adm-btn-dark"
                  disabled={actionLoading === "add"}
                >
                  {actionLoading === "add" ? t("clinicManagement.creating") : t("clinicManagement.createClinic")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
