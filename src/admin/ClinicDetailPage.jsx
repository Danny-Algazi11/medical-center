import { useState, useEffect, useCallback } from "react";
import { useParams, useLocation, useNavigate, Link } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";
import DocumentCard from "./DocumentCard";
import { useTranslation } from "../i18n/useTranslation";
import {
  getClinics,
  getDoctors,
  approveClinic,
  rejectClinic,
  suspendClinic,
  reactivateClinic,
} from "../api/admin";
import "../components/styles/Admin.css";

function getStatusColor(status) {
  const map = {
    pending: "amber",
    active: "green",
    rejected: "red",
    suspended: "red",
  };
  return map[status] || "gray";
}

function getStatusLabel(status, t) {
  const map = {
    pending: t("adminCommon.pending"),
    active: t("adminCommon.active"),
    rejected: t("adminCommon.rejected"),
    suspended: t("adminCommon.suspended"),
  };
  return map[status] || status;
}

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function ClinicDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Instant render if we arrived via the Link in ClinicManagement.jsx
  // (state.clinic is the raw admin/clinics record for this row).
  const [clinic, setClinic] = useState(location.state?.clinic || null);
  const [loading, setLoading] = useState(!location.state?.clinic);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [ownerDoctor, setOwnerDoctor] = useState(null);
  const [ownerDoctorLoading, setOwnerDoctorLoading] = useState(false);

  // NOTE: same gap as the doctor detail page — the collection has no
  // GET /admin/clinics/{id}, only the paginated list. On a hard refresh
  // (no router state) we fall back to the unfiltered list and match by id.
  const loadFromList = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getClinics();
      const found = (res.data.data || []).find(
        (c) => String(c.id) === String(id),
      );
      if (!found) {
        setError("Clinic not found. It may be on a later page of the list.");
      } else {
        setClinic(found);
      }
    } catch (err) {
      setError(err.message || "Failed to load clinic");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!location.state?.clinic) {
      loadFromList();
    }
  }, [loadFromList, location.state]);

  // The collection has no "doctor who owns this clinic" endpoint, so we
  // match the clinic's owner against the admin doctors list by email —
  // that's the only shared field between the two records.
  useEffect(() => {
    if (!clinic?.owner?.email) {
      setOwnerDoctor(null);
      return;
    }
    let cancelled = false;
    setOwnerDoctorLoading(true);
    getDoctors()
      .then((res) => {
        if (cancelled) return;
        const match = (res.data.data || []).find(
          (d) => d.account?.email === clinic.owner.email,
        );
        setOwnerDoctor(match || null);
      })
      .catch(() => {
        if (!cancelled) setOwnerDoctor(null);
      })
      .finally(() => {
        if (!cancelled) setOwnerDoctorLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [clinic?.owner?.email]);

  async function runAction(fn) {
    setActionLoading(true);
    setError("");
    try {
      const res = await fn();
      // approve/reject/suspend/reactivate return the updated clinic —
      // merge over the existing record so fields the action response
      // doesn't echo back (e.g. departments) aren't lost.
      setClinic((prev) => ({ ...prev, ...res.data.data }));
    } catch (err) {
      setError(err.message || "Action failed");
    } finally {
      setActionLoading(false);
    }
  }

  function handleApprove() {
    runAction(() => approveClinic(id));
  }

  function handleReject() {
    const reason = window.prompt("Reason for rejecting this clinic:");
    if (reason === null) return;
    runAction(() => rejectClinic(id, reason));
  }

  function handleSuspend() {
    const reason = window.prompt("Reason for suspending this clinic:");
    if (reason === null) return;
    runAction(() => suspendClinic(id, reason));
  }

  function handleReactivate() {
    const reason =
      window.prompt("Reason for reactivating this clinic (optional):") || "";
    runAction(() => reactivateClinic(id, reason));
  }

  const status = clinic?.status;

  return (
    <div className="adm-shell">
      <AdminSidebar />
      <div className="adm-main">
        <AdminTopbar title={t("clinicDetail.title")} searchPlaceholder={t("adminCommon.searchClinics")} />
        <div className="adm-content">
          <div style={{ marginBottom: 14 }}>
            <button
              type="button"
              onClick={() => navigate("/admin/clinics")}
              className="adm-btn adm-btn-outline"
              style={{ padding: "6px 12px", fontSize: 12 }}
            >
              <i className="ti ti-arrow-left" aria-hidden="true" /> {t("clinicDetail.backToClinics")}
            </button>
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

          {loading && (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <p>{t("clinicDetail.loadingProfile")}</p>
            </div>
          )}

          {!loading && clinic && (
            <>
              {/* Header */}
              <div className="adm-page-header">
                <div className="adm-page-header-left">
                  <h1 style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <i className="ti ti-building-hospital" aria-hidden="true" />
                    {clinic.name}
                    <span className={`adm-badge adm-badge-${getStatusColor(status)}`}>
                      {getStatusLabel(status, t)}
                    </span>
                  </h1>
                  <p>{clinic.address || t("clinicDetail.noAddress")}</p>
                </div>
                <div className="adm-header-actions">
                  {status === "pending" && (
                    <>
                      <button
                        className="adm-btn adm-btn-green"
                        onClick={handleApprove}
                        disabled={actionLoading}
                      >
                        {actionLoading ? "..." : t("clinicDetail.approve")}
                      </button>
                      <button
                        className="adm-btn adm-btn-red"
                        onClick={handleReject}
                        disabled={actionLoading}
                      >
                        {actionLoading ? "..." : t("clinicDetail.reject")}
                      </button>
                    </>
                  )}
                  {status === "active" && (
                    <button
                      className="adm-btn adm-btn-amber"
                      onClick={handleSuspend}
                      disabled={actionLoading}
                    >
                      {actionLoading ? "..." : t("clinicDetail.suspend")}
                    </button>
                  )}
                  {status === "suspended" && (
                    <button
                      className="adm-btn adm-btn-green"
                      onClick={handleReactivate}
                      disabled={actionLoading}
                    >
                      {actionLoading ? "..." : t("clinicDetail.reactivate")}
                    </button>
                  )}
                  {status === "rejected" && (
                    <span style={{ fontSize: 12, color: "var(--adm-text-muted)" }}>
                      {t("clinicDetail.noActionsRejected")}
                    </span>
                  )}
                </div>
              </div>

              {/* Profile + departments */}
              <div className="adm-grid-2 adm-section-gap">
                <div className="adm-card">
                  <div className="adm-card-header">
                    <h2 className="adm-card-title">{t("clinicDetail.clinicInformation")}</h2>
                  </div>
                  <div style={{ padding: "4px 18px 18px" }}>
                    {[
                      [t("clinicDetail.phone"), clinic.phone || "N/A"],
                      [t("clinicDetail.email"), clinic.email || "N/A"],
                      [t("clinicDetail.address"), clinic.address || "N/A"],
                      [
                        t("clinicDetail.coordinates"),
                        clinic.latitude && clinic.longitude
                          ? `${clinic.latitude}, ${clinic.longitude}`
                          : "N/A",
                      ],
                      [t("clinicDetail.owner"), clinic.owner?.name || "—"],
                      [t("clinicDetail.ownerEmail"), clinic.owner?.email || "—"],
                      [t("clinicDetail.reviewNotes"), clinic.review_notes || t("clinicDetail.none")],
                      [t("clinicDetail.registeredOn"), formatDate(clinic.created_at)],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          padding: "9px 0",
                          borderBottom: "1px solid #f5f5f5",
                          fontSize: 13,
                          gap: 12,
                        }}
                      >
                        <span style={{ color: "var(--adm-text-muted)", flexShrink: 0 }}>
                          {label}
                        </span>
                        <span style={{ fontWeight: 500, textAlign: "right" }}>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="adm-card">
                  <div className="adm-card-header">
                    <h2 className="adm-card-title">{t("clinicDetail.departments")}</h2>
                  </div>
                  <div style={{ padding: "4px 18px 18px", display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {clinic.departments && clinic.departments.length > 0 ? (
                      clinic.departments.map((d) => (
                        <span key={d.id} className="adm-badge adm-badge-blue">
                          {d.name}
                        </span>
                      ))
                    ) : (
                      <span style={{ fontSize: 12, color: "var(--adm-text-muted)" }}>
                        {t("clinicDetail.noDepartments")}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* License document */}
              <div className="adm-card adm-section-gap">
                <div className="adm-card-header">
                  <h2 className="adm-card-title">{t("clinicDetail.submittedDocuments")}</h2>
                </div>
                <div
                  style={{
                    padding: "4px 18px 20px",
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                    gap: 14,
                  }}
                >
                  <DocumentCard
                    label={t("clinicDetail.businessLicense")}
                    url={clinic.license_url}
                    icon="ti-file-certificate"
                  />
                </div>
              </div>

              {/* Owning doctor's uploaded documents */}
              <div className="adm-card adm-section-gap">
                <div className="adm-card-header">
                  <h2 className="adm-card-title">
                    {t("clinicDetail.documentsByOwner")} {clinic.owner?.name || t("clinicDetail.theCreatingDoctor")}
                  </h2>
                  {ownerDoctor && (
                    <Link
                      to={`/admin/doctors/${ownerDoctor.id}`}
                      state={{ doctor: ownerDoctor }}
                      className="adm-card-link"
                    >
                      {t("clinicDetail.viewDoctorProfile")}
                    </Link>
                  )}
                </div>
                <div
                  style={{
                    padding: "4px 18px 20px",
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                    gap: 14,
                  }}
                >
                  {ownerDoctorLoading && (
                    <span style={{ fontSize: 12, color: "var(--adm-text-muted)" }}>
                      {t("clinicDetail.loadingDoctorDocs")}
                    </span>
                  )}
                  {!ownerDoctorLoading && !clinic.owner && (
                    <span style={{ fontSize: 12, color: "var(--adm-text-muted)" }}>
                      {t("clinicDetail.noOwnerOnFile")}
                    </span>
                  )}
                  {!ownerDoctorLoading && clinic.owner && !ownerDoctor && (
                    <span style={{ fontSize: 12, color: "var(--adm-text-muted)" }}>
                      {t("clinicDetail.noMatchingDoctor")} {clinic.owner.email}.
                    </span>
                  )}
                  {!ownerDoctorLoading && ownerDoctor && (
                    <>
                      <DocumentCard
                        label={t("doctorDetail.photo")}
                        url={ownerDoctor.documents?.photo_url}
                        icon="ti-user-circle"
                      />
                      <DocumentCard
                        label={t("clinicDetail.medicalLicense")}
                        url={ownerDoctor.documents?.license_file_url}
                        icon="ti-file-certificate"
                      />
                      <DocumentCard
                        label={t("clinicDetail.idCard")}
                        url={ownerDoctor.documents?.id_card_url}
                        icon="ti-id"
                      />
                      {(ownerDoctor.documents?.certificate_urls || []).map((url, i) => (
                        <DocumentCard
                          key={url + i}
                          label={`${t("clinicDetail.certificate")} ${i + 1}`}
                          url={url}
                          icon="ti-certificate"
                        />
                      ))}
                    </>
                  )}
                </div>
              </div>
            </>
          )}

          {!loading && !clinic && !error && (
            <div className="adm-card" style={{ padding: 40, textAlign: "center" }}>
              <p>{t("clinicDetail.notFound")}</p>
              <Link to="/admin/clinics" className="adm-card-link">
                {t("clinicDetail.backToClinicList")}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
