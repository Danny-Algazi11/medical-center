import { useState, useEffect, useCallback } from "react";
import { useParams, useLocation, useNavigate, Link } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";
import DocumentCard from "./DocumentCard";
import {
  getDoctors,
  approveDoctor,
  rejectDoctor,
  suspendDoctor,
  reactivateDoctor,
} from "../api/admin";
import "../components/styles/Admin.css";

function getStatusColor(status) {
  const map = {
    pending: "amber",
    verified: "green",
    rejected: "red",
    suspended: "red",
  };
  return map[status] || "gray";
}

function getStatusLabel(status) {
  const map = {
    pending: "Pending",
    verified: "Verified",
    rejected: "Rejected",
    suspended: "Suspended",
  };
  return map[status] || "Unknown";
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

export default function DoctorDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Instant render if we arrived via the row click in DoctorManagement.jsx
  // (state.doctor is the raw admin/doctors record for this row).
  const [doctor, setDoctor] = useState(location.state?.doctor || null);
  const [loading, setLoading] = useState(!location.state?.doctor);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // The collection has no GET /admin/doctors/{id}, only the paginated list.
  // On a hard refresh (no router state) fall back to the unfiltered list
  // and match by id.
  const loadFromList = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getDoctors();
      const found = (res.data.data || []).find(
        (d) => String(d.id) === String(id),
      );
      if (!found) {
        setError("Doctor not found. They may be on a later page of the list.");
      } else {
        setDoctor(found);
      }
    } catch (err) {
      setError(err.message || "Failed to load doctor");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!location.state?.doctor) {
      loadFromList();
    }
  }, [loadFromList, location.state]);

  async function runAction(fn) {
    setActionLoading(true);
    setError("");
    try {
      const res = await fn();
      // approve/reject/suspend/reactivate return the updated doctor —
      // merge over the existing record so fields the action response
      // doesn't echo back (e.g. documents) aren't lost.
      setDoctor((prev) => ({ ...prev, ...res.data.data }));
    } catch (err) {
      setError(err.message || "Action failed");
    } finally {
      setActionLoading(false);
    }
  }

  function handleApprove() {
    runAction(() => approveDoctor(id));
  }

  function handleReject() {
    const reason = window.prompt("Reason for rejecting this doctor:");
    if (reason === null) return;
    runAction(() => rejectDoctor(id, reason));
  }

  function handleSuspend() {
    const reason = window.prompt("Reason for suspending this doctor:");
    if (reason === null) return;
    runAction(() => suspendDoctor(id, reason));
  }

  function handleReactivate() {
    runAction(() => reactivateDoctor(id));
  }

  const status = doctor?.verification_status;
  const account = doctor?.account || {};
  const documents = doctor?.documents || {};

  return (
    <div className="adm-shell">
      <AdminSidebar />
      <div className="adm-main">
        <AdminTopbar title="Doctor Profile" searchPlaceholder="Search doctors..." />
        <div className="adm-content">
          <div style={{ marginBottom: 14 }}>
            <button
              type="button"
              onClick={() => navigate("/admin/doctors")}
              className="adm-btn adm-btn-outline"
              style={{ padding: "6px 12px", fontSize: 12 }}
            >
              <i className="ti ti-arrow-left" aria-hidden="true" /> Back to doctors
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
              <p>Loading doctor profile...</p>
            </div>
          )}

          {!loading && doctor && (
            <>
              {/* Header */}
              <div className="adm-page-header">
                <div className="adm-page-header-left">
                  <h1 style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <i className="ti ti-stethoscope" aria-hidden="true" />
                    {account.full_name || `${account.first_name || ""} ${account.last_name || ""}`.trim() || "Doctor"}
                    <span className={`adm-badge adm-badge-${getStatusColor(status)}`}>
                      {getStatusLabel(status)}
                    </span>
                  </h1>
                  <p>{account.email || "No email on file"}</p>
                </div>
                <div className="adm-header-actions">
                  {status === "pending" && (
                    <>
                      <button
                        className="adm-btn adm-btn-green"
                        onClick={handleApprove}
                        disabled={actionLoading}
                      >
                        {actionLoading ? "..." : "Verify"}
                      </button>
                      <button
                        className="adm-btn adm-btn-red"
                        onClick={handleReject}
                        disabled={actionLoading}
                      >
                        {actionLoading ? "..." : "Reject"}
                      </button>
                    </>
                  )}
                  {status === "verified" && (
                    <button
                      className="adm-btn adm-btn-amber"
                      onClick={handleSuspend}
                      disabled={actionLoading}
                    >
                      {actionLoading ? "..." : "Suspend"}
                    </button>
                  )}
                  {status === "suspended" && (
                    <button
                      className="adm-btn adm-btn-green"
                      onClick={handleReactivate}
                      disabled={actionLoading}
                    >
                      {actionLoading ? "..." : "Reactivate"}
                    </button>
                  )}
                  {status === "rejected" && (
                    <span style={{ fontSize: 12, color: "var(--adm-text-muted)" }}>
                      No actions available for rejected doctors
                    </span>
                  )}
                </div>
              </div>

              {/* Profile */}
              <div className="adm-grid-2 adm-section-gap">
                <div className="adm-card">
                  <div className="adm-card-header">
                    <h2 className="adm-card-title">Doctor information</h2>
                  </div>
                  <div style={{ padding: "4px 18px 18px" }}>
                    {[
                      ["Email", account.email || "N/A"],
                      ["Phone", account.phone || "N/A"],
                      ["Date of birth", formatDate(account.dob)],
                      ["Gender", account.gender || "N/A"],
                      ["Address", account.address || "N/A"],
                      ["Registered on", formatDate(doctor.created_at)],
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
                    <h2 className="adm-card-title">Practice</h2>
                  </div>
                  <div style={{ padding: "4px 18px 18px", display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {doctor.profile?.departments?.length > 0 ? (
                      doctor.profile.departments.map((d) => (
                        <span key={d.id} className="adm-badge adm-badge-blue">
                          {d.name}
                        </span>
                      ))
                    ) : (
                      <span style={{ fontSize: 12, color: "var(--adm-text-muted)" }}>
                        No practice profile submitted yet
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div className="adm-card adm-section-gap">
                <div className="adm-card-header">
                  <h2 className="adm-card-title">Submitted documents</h2>
                </div>
                <div
                  style={{
                    padding: "4px 18px 20px",
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                    gap: 14,
                  }}
                >
                  <DocumentCard label="Photo" url={documents.photo_url} icon="ti-user-circle" />
                  <DocumentCard
                    label="Medical license"
                    url={documents.license_file_url}
                    icon="ti-file-certificate"
                  />
                  <DocumentCard label="ID card" url={documents.id_card_url} icon="ti-id" />
                  {(documents.certificate_urls || []).map((url, i) => (
                    <DocumentCard
                      key={url + i}
                      label={`Certificate ${i + 1}`}
                      url={url}
                      icon="ti-certificate"
                    />
                  ))}
                  {!documents.photo_url &&
                    !documents.license_file_url &&
                    !documents.id_card_url &&
                    (documents.certificate_urls || []).length === 0 && (
                      <span style={{ fontSize: 12, color: "var(--adm-text-muted)" }}>
                        No documents on file
                      </span>
                    )}
                </div>
              </div>
            </>
          )}

          {!loading && !doctor && !error && (
            <div className="adm-card" style={{ padding: 40, textAlign: "center" }}>
              <p>Doctor not found.</p>
              <Link to="/admin/doctors" className="adm-card-link">
                ← Back to doctor list
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
