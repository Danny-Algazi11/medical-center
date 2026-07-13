import { useState } from "react";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";
import "../components/styles/Admin.css";

const DOCTORS = [
  {
    id: 1,
    initials: "DA",
    name: "Dr. Ahmad Karimi",
    spec: "Cardiology",
    clinic: "City Central",
    email: "a.karimi@medcenter.com",
    phone: "+1 555-001",
    status: "active",
    sLabel: "Active",
    verified: true,
  },
  {
    id: 2,
    initials: "JL",
    name: "Dr. Julia Lee",
    spec: "Pediatrics",
    clinic: "North Branch",
    email: "j.lee@medcenter.com",
    phone: "+1 555-002",
    status: "amber",
    sLabel: "Pending",
    verified: false,
  },
  {
    id: 3,
    initials: "MK",
    name: "Dr. Marcus Kim",
    spec: "General",
    clinic: "East Branch",
    email: "m.kim@medcenter.com",
    phone: "+1 555-003",
    status: "red",
    sLabel: "Suspended",
    verified: true,
  },
  {
    id: 4,
    initials: "TC",
    name: "Dr. Tahani Chen",
    spec: "Dermatology",
    clinic: "City Central",
    email: "t.chen@medcenter.com",
    phone: "+1 555-004",
    status: "green",
    sLabel: "Active",
    verified: true,
  },
  {
    id: 5,
    initials: "RS",
    name: "Dr. Robert Sterling",
    spec: "Orthopedics",
    clinic: "South Branch",
    email: "r.sterling@medcenter.com",
    phone: "+1 555-005",
    status: "active",
    sLabel: "Active",
    verified: true,
  },
  {
    id: 6,
    initials: "PN",
    name: "Dr. Priya Nair",
    spec: "Neurology",
    clinic: "North Branch",
    email: "p.nair@medcenter.com",
    phone: "+1 555-006",
    status: "amber",
    sLabel: "Pending",
    verified: false,
  },
  {
    id: 7,
    initials: "OB",
    name: "Dr. Omar Bakr",
    spec: "Cardiology",
    clinic: "City Central",
    email: "o.bakr@medcenter.com",
    phone: "+1 555-007",
    status: "gray",
    sLabel: "Inactive",
    verified: true,
  },
];

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
  const [doctors, setDoctors] = useState(DOCTORS);
  const [filter, setFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(MODAL_INIT);

  const filtered =
    filter === "All" ? doctors : doctors.filter((d) => d.sLabel === filter);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleAdd(e) {
    e.preventDefault();
    const newDoc = {
      id: Date.now(),
      initials: (form.firstName[0] || "") + (form.lastName[0] || ""),
      name: `Dr. ${form.firstName} ${form.lastName}`,
      spec: form.specialty,
      clinic: form.clinic,
      email: form.email,
      phone: form.phone,
      status: "amber",
      sLabel: "Pending",
      verified: false,
    };
    setDoctors((prev) => [newDoc, ...prev]);
    setForm(MODAL_INIT);
    setShowModal(false);
  }

  function changeStatus(id, status, sLabel) {
    setDoctors((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status, sLabel } : d)),
    );
  }

  function verifyDoctor(id) {
    setDoctors((prev) =>
      prev.map((d) =>
        d.id === id
          ? { ...d, verified: true, status: "green", sLabel: "Active" }
          : d,
      ),
    );
  }

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
                num: doctors.filter((d) => d.sLabel === "Suspended").length,
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
            {["All", "Active", "Pending", "Suspended", "Inactive"].map((f) => (
              <button
                key={f}
                className={`adm-btn ${filter === f ? "adm-btn-dark" : "adm-btn-outline"}`}
                style={{ padding: "6px 14px", fontSize: 12 }}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
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
                {filtered.map((d) => (
                  <tr key={d.id}>
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
                    <td>
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
                          onClick={() => verifyDoctor(d.id)}
                        >
                          Verify
                        </button>
                      )}
                    </td>
                    <td>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          justifyContent: "flex-end",
                        }}
                      >
                        <button className="adm-icon-btn" title="Edit">
                          <i className="ti ti-edit" aria-hidden="true" />
                        </button>
                        {d.sLabel !== "Active" && (
                          <button
                            className="adm-btn adm-btn-green"
                            style={{ padding: "5px 10px", fontSize: 11 }}
                            onClick={() =>
                              changeStatus(d.id, "green", "Active")
                            }
                          >
                            Activate
                          </button>
                        )}
                        {d.sLabel === "Active" && (
                          <button
                            className="adm-btn adm-btn-amber"
                            style={{ padding: "5px 10px", fontSize: 11 }}
                            onClick={() =>
                              changeStatus(d.id, "amber", "Suspended")
                            }
                          >
                            Suspend
                          </button>
                        )}
                        <button
                          className="adm-btn adm-btn-red"
                          style={{ padding: "5px 10px", fontSize: 11 }}
                          onClick={() => changeStatus(d.id, "gray", "Inactive")}
                        >
                          Deactivate
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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
                  Fill in the doctor's details. Status will be set to Pending
                  until verified.
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
