import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";
import {
  getDoctors,
  approveDoctor,
  reactivateDoctor,
  rejectDoctor,
  suspendDoctor,
} from "../api/admin";

import "../components/styles/Admin.css";

const CLINICS = ["City Central", "North Branch", "East Branch", "South Branch"];
const SPECIALTIES = [
  "Cardiology",
  "Pediatrics",
  "General",
  "Dermatology",
  "Orthopedics",
  "Neurology",
];

const MODAL_INIT = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  specialty: "",
  clinic: "",
  licenseNo: "",
  notes: "",
};

export default function DoctorManagement() {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(MODAL_INIT);
  const [actionLoading, setActionLoading] = useState(null);

  // Load doctors on mount and filter change
  useEffect(() => {
    loadDoctors();
  }, [filter]);

  async function loadDoctors() {
    setLoading(true);
    setError("");
    try {
      const status =
        filter === "Active"
          ? "verified"
          : filter === "Pending"
            ? "pending"
            : filter === "Suspended"
              ? "suspended"
              : undefined;

      const res = await getDoctors(status ? { status } : undefined);
      const doctorsList = res.data.data || [];

      setDoctors(
        doctorsList.map((d) => ({
          id: d.id,
          initials:
            (d.account?.first_name?.[0] || d.first_name?.[0] || "D") +
            (d.account?.last_name?.[0] || d.last_name?.[0] || ""),
          name: `Dr. ${d.account?.first_name || d.first_name || ""} ${d.account?.last_name || d.last_name || ""}`.trim(),
          spec:
            d.profile?.departments?.[0]?.name ||
            d.departments?.[0]?.name ||
            "General",
          clinic:
            d.profile?.clinics?.[0]?.name ||
            d.clinics?.[0]?.name ||
            "Unassigned",
          email: d.account?.email || d.email,
          phone: d.account?.phone || d.phone || "N/A",
          status: getStatusColor(d.verification_status),
          sLabel: getStatusLabel(d.verification_status),
          verified: d.verification_status === "verified",
          verification_status: d.verification_status,
          // Raw API record — passed to the detail page on row click so it
          // can render instantly without a second fetch.
          raw: d,
        })),
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load doctors",
      );
      console.error("Error loading doctors:", err);
    } finally {
      setLoading(false);
    }
  }

  function getStatusColor(status) {
    const statusMap = {
      pending: "amber",
      verified: "green",
      rejected: "red",
      suspended: "red",
    };
    return statusMap[status] || "gray";
  }

  function getStatusLabel(status) {
    const labelMap = {
      pending: "Pending",
      verified: "Active",
      rejected: "Rejected",
      suspended: "Suspended",
    };
    return labelMap[status] || "Inactive";
  }

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleAdd(e) {
    e.preventDefault();
    setShowModal(false);
    setForm(MODAL_INIT);
  }

  function goToDoctor(d) {
    navigate(`/admin/doctors/${d.id}`, { state: { doctor: d.raw } });
  }

  async function handleApprove(doctorId) {
    setActionLoading(doctorId);
    try {
      await approveDoctor(doctorId);
      setDoctors((prev) =>
        prev.map((d) =>
          d.id === doctorId
            ? {
                ...d,
                status: "green",
                sLabel: "Active",
                verified: true,
                verification_status: "verified",
              }
            : d,
        ),
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to approve doctor",
      );
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(doctorId) {
    setActionLoading(doctorId);
    try {
      await rejectDoctor(doctorId, "Rejected by admin");
      setDoctors((prev) =>
        prev.map((d) =>
          d.id === doctorId
            ? {
                ...d,
                status: "red",
                sLabel: "Rejected",
                verified: false,
                verification_status: "rejected",
              }
            : d,
        ),
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to reject doctor",
      );
    } finally {
      setActionLoading(null);
    }
  }

  async function handleSuspend(doctorId) {
    setActionLoading(doctorId);
    try {
      await suspendDoctor(doctorId, "Suspended by admin");
      setDoctors((prev) =>
        prev.map((d) =>
          d.id === doctorId
            ? {
                ...d,
                status: "red",
                sLabel: "Suspended",
                verification_status: "suspended",
              }
            : d,
        ),
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to suspend doctor",
      );
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReactivate(doctorId) {
    setActionLoading(doctorId);
    try {
      await reactivateDoctor(doctorId);
      setDoctors((prev) =>
        prev.map((d) =>
          d.id === doctorId
            ? {
                ...d,
                status: "green",
                sLabel: "Active",
                verification_status: "verified",
              }
            : d,
        ),
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to reactivate doctor",
      );
    } finally {
      setActionLoading(null);
    }
  }

  const filtered =
    filter === "All" ? doctors : doctors.filter((d) => d.sLabel === filter);

  return (
    <div className="adm-shell">
      <AdminSidebar />
      <div className="adm-main">
        <AdminTopbar
          title="Doctor Management"
          searchPlaceholder="Search doctors..."
        />
        <div className="adm-content">
          <div className="adm-page-header">
            <div className="adm-page-header-left">
              <h1>Doctor management</h1>
              <p>
                Add, edit, verify, suspend, or deactivate doctor accounts and
                manage clinic assignments.
              </p>
            </div>
            <div className="adm-header-actions">
              <button className="adm-btn adm-btn-outline">
                <i className="ti ti-download" aria-hidden="true" /> Export
              </button>
              <button
                className="adm-btn adm-btn-dark"
                onClick={() => setShowModal(true)}
              >
                <i className="ti ti-plus" aria-hidden="true" /> Add doctor
              </button>
            </div>
          </div>

          {/* Error display */}
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

          {/* Loading state */}
          {loading && (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <p>Loading doctors...</p>
            </div>
          )}

          {!loading && (
            <>
              {/* Stats row */}
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
                    label: "Total",
                    num: doctors.length,
                    color: "var(--adm-text-primary)",
                  },
                  {
                    label: "Active",
                    num: doctors.filter((d) => d.sLabel === "Active").length,
                    color: "var(--adm-green)",
                  },
                  {
                    label: "Pending",
                    num: doctors.filter((d) => d.sLabel === "Pending").length,
                    color: "var(--adm-amber)",
                  },
                  {
                    label: "Suspended",
                    num: doctors.filter((d) => d.sLabel === "Suspended")
                      .length,
                    color: "var(--adm-red)",
                  },
                ].map((s) => (
                  <div className="adm-stat-card" key={s.label}>
                    <div>
                      <div className="adm-stat-label">{s.label} doctors</div>
                      <div className="adm-stat-num" style={{ color: s.color }}>
                        {s.num}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Filter bar */}
              <div className="adm-filter-bar">
                {["All", "Active", "Pending", "Suspended", "Inactive"].map(
                  (f) => (
                    <button
                      key={f}
                      className={`adm-btn ${filter === f ? "adm-btn-dark" : "adm-btn-outline"}`}
                      style={{ padding: "6px 14px", fontSize: 12 }}
                      onClick={() => setFilter(f)}
                    >
                      {f}
                    </button>
                  ),
                )}
                <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
                  <select className="adm-filter-select">
                    <option>All specialties</option>
                    {SPECIALTIES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                  <select className="adm-filter-select">
                    <option>All clinics</option>
                    {CLINICS.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Table */}
              <div className="adm-card">
                <table className="adm-table">
                  <thead>
                    <tr>
                      <th>Doctor</th>
                      <th>Specialty</th>
                      <th>Clinic</th>
                      <th>Contact</th>
                      <th>Status</th>
                      <th>Verified</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length > 0 ? (
                      filtered.map((d) => (
                        <tr
                          key={d.id}
                          onClick={() => goToDoctor(d)}
                          style={{ cursor: "pointer" }}
                          title="View doctor profile"
                        >
                          <td>
                            <div className="adm-cell">
                              <div className="adm-avatar">{d.initials}</div>
                              <div>
                                <div className="adm-cell-name">{d.name}</div>
                                <div className="adm-cell-sub">{d.email}</div>
                              </div>
                            </div>
                          </td>
                          <td
                            style={{
                              fontSize: 12,
                              color: "var(--adm-text-secondary)",
                            }}
                          >
                            {d.spec}
                          </td>
                          <td
                            style={{
                              fontSize: 12,
                              color: "var(--adm-text-secondary)",
                            }}
                          >
                            {d.clinic}
                          </td>
                          <td
                            style={{
                              fontSize: 12,
                              color: "var(--adm-text-secondary)",
                            }}
                          >
                            {d.phone}
                          </td>
                          <td>
                            <span className={`adm-badge adm-badge-${d.status}`}>
                              {d.sLabel}
                            </span>
                          </td>
                          <td onClick={(e) => e.stopPropagation()}>
                            {d.verified ? (
                              <span className="adm-badge adm-badge-teal">
                                <i
                                  className="ti ti-circle-check"
                                  style={{ fontSize: 11 }}
                                  aria-hidden="true"
                                />{" "}
                                Verified
                              </span>
                            ) : (
                              <button
                                className="adm-btn adm-btn-outline"
                                style={{ padding: "4px 10px", fontSize: 11 }}
                                onClick={() => handleApprove(d.id)}
                                disabled={actionLoading === d.id}
                              >
                                {actionLoading === d.id ? "..." : "Approve"}
                              </button>
                            )}
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
                              {d.sLabel === "Pending" && (
                                <>
                                  <button
                                    className="adm-btn adm-btn-green"
                                    style={{ padding: "5px 10px", fontSize: 11 }}
                                    onClick={() => handleApprove(d.id)}
                                    disabled={actionLoading === d.id}
                                  >
                                    {actionLoading === d.id ? "..." : "Approve"}
                                  </button>
                                  <button
                                    className="adm-btn adm-btn-red"
                                    style={{ padding: "5px 10px", fontSize: 11 }}
                                    onClick={() => handleReject(d.id)}
                                    disabled={actionLoading === d.id}
                                  >
                                    {actionLoading === d.id ? "..." : "Reject"}
                                  </button>
                                </>
                              )}
                              {d.sLabel === "Active" && (
                                <button
                                  className="adm-btn adm-btn-amber"
                                  style={{ padding: "5px 10px", fontSize: 11 }}
                                  onClick={() => handleSuspend(d.id)}
                                  disabled={actionLoading === d.id}
                                >
                                  {actionLoading === d.id ? "..." : "Suspend"}
                                </button>
                              )}
                              {d.sLabel === "Suspended" && (
                                <button
                                  className="adm-btn adm-btn-green"
                                  style={{ padding: "5px 10px", fontSize: 11 }}
                                  onClick={() => handleReactivate(d.id)}
                                  disabled={actionLoading === d.id}
                                >
                                  {actionLoading === d.id
                                    ? "..."
                                    : "Reactivate"}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" style={{ textAlign: "center", padding: "20px" }}>
                          No doctors found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <div className="adm-table-footer">
                  <span>
                    Showing {filtered.length} of {doctors.length} doctors
                  </span>
                  <div className="adm-pagination">
                    <button className="adm-page-btn">
                      <i className="ti ti-chevron-left" />
                    </button>
                    <button className="adm-page-btn active">1</button>
                    <button className="adm-page-btn">2</button>
                    <button className="adm-page-btn">
                      <i className="ti ti-chevron-right" />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Add Doctor Modal */}
      {showModal && (
        <div
          className="adm-modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="adm-modal">
            <div className="adm-modal-header">
              <div>
                <h2>Add new doctor</h2>
                <p>
                  Fill in the doctor's details. Note: Actual doctor registration
                  happens through the signup flow. This is for manual admin entry.
                </p>
              </div>
              <button
                className="adm-icon-btn"
                onClick={() => setShowModal(false)}
                aria-label="Close"
              >
                <i className="ti ti-x" aria-hidden="true" />
              </button>
            </div>
            <form onSubmit={handleAdd}>
              <div className="adm-modal-body">
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 12,
                  }}
                >
                  <div className="adm-field">
                    <label className="adm-label">First name</label>
                    <input
                      className="adm-input"
                      name="firstName"
                      value={form.firstName}
                      onChange={handleChange}
                      placeholder="Ahmad"
                      required
                    />
                  </div>
                  <div className="adm-field">
                    <label className="adm-label">Last name</label>
                    <input
                      className="adm-input"
                      name="lastName"
                      value={form.lastName}
                      onChange={handleChange}
                      placeholder="Karimi"
                      required
                    />
                  </div>
                </div>
                <div className="adm-field">
                  <label className="adm-label">Email address</label>
                  <input
                    className="adm-input"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="doctor@medcenter.com"
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
                    <label className="adm-label">Phone</label>
                    <input
                      className="adm-input"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="+1 555-000"
                    />
                  </div>
                  <div className="adm-field">
                    <label className="adm-label">License number</label>
                    <input
                      className="adm-input"
                      name="licenseNo"
                      value={form.licenseNo}
                      onChange={handleChange}
                      placeholder="LIC-000000"
                    />
                  </div>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 12,
                  }}
                >
                  <div className="adm-field">
                    <label className="adm-label">Specialty</label>
                    <select
                      className="adm-select"
                      name="specialty"
                      value={form.specialty}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select specialty</option>
                      {SPECIALTIES.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div className="adm-field">
                    <label className="adm-label">Assign to clinic</label>
                    <select
                      className="adm-select"
                      name="clinic"
                      value={form.clinic}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select clinic</option>
                      {CLINICS.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="adm-field">
                  <label className="adm-label">Notes (optional)</label>
                  <textarea
                    className="adm-textarea"
                    name="notes"
                    value={form.notes}
                    onChange={handleChange}
                    placeholder="Additional notes about this doctor..."
                  />
                </div>
              </div>
              <div className="adm-modal-footer">
                <button
                  type="button"
                  className="adm-btn adm-btn-outline"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="adm-btn adm-btn-dark">
                  Add doctor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
