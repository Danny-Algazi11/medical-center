import { useState } from "react";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";
import "../components/styles/Admin.css";

const CLINICS_DATA = [
  {
    id: 1,
    name: "City Central Branch",
    city: "New York",
    address: "123 Main St",
    status: "active",
    sLabel: "Active",
    doctors: 12,
    appts: 42,
    phone: "+1 212-555-0001",
    manager: "Sarah Jenkins",
  },
  {
    id: 2,
    name: "North Branch",
    city: "Brooklyn",
    address: "456 North Ave",
    status: "active",
    sLabel: "Active",
    doctors: 8,
    appts: 28,
    phone: "+1 718-555-0002",
    manager: "Tom Bradley",
  },
  {
    id: 3,
    name: "East Branch",
    city: "Queens",
    address: "789 East Blvd",
    status: "red",
    sLabel: "Inactive",
    doctors: 0,
    appts: 0,
    phone: "+1 718-555-0003",
    manager: "N/A",
  },
  {
    id: 4,
    name: "South Branch",
    city: "Manhattan",
    address: "321 South St",
    status: "active",
    sLabel: "Active",
    doctors: 6,
    appts: 18,
    phone: "+1 212-555-0004",
    manager: "Alice Morgan",
  },
  {
    id: 5,
    name: "West Clinic",
    city: "Staten Island",
    address: "654 West Rd",
    status: "amber",
    sLabel: "Pending",
    doctors: 3,
    appts: 0,
    phone: "+1 718-555-0005",
    manager: "James Wu",
  },
];

const ASSOC_DATA = [
  {
    doctor: "Dr. Ahmad Karimi",
    spec: "Cardiology",
    clinic: "City Central Branch",
    since: "Jan 2022",
    primary: true,
  },
  {
    doctor: "Dr. Julia Lee",
    spec: "Pediatrics",
    clinic: "North Branch",
    since: "Mar 2023",
    primary: true,
  },
  {
    doctor: "Dr. Marcus Kim",
    spec: "General",
    clinic: "East Branch",
    since: "Jun 2021",
    primary: false,
  },
  {
    doctor: "Dr. Tahani Chen",
    spec: "Dermatology",
    clinic: "City Central Branch",
    since: "Aug 2022",
    primary: true,
  },
  {
    doctor: "Dr. Robert Sterling",
    spec: "Orthopedics",
    clinic: "South Branch",
    since: "Nov 2020",
    primary: true,
  },
];

const MODAL_INIT = {
  name: "",
  city: "",
  address: "",
  phone: "",
  manager: "",
  capacity: "",
};

export default function ClinicManagement() {
  const [tab, setTab] = useState("clinics");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(MODAL_INIT);
  const [clinics, setClinics] = useState(CLINICS_DATA);

  function handleChange(e) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  function handleAdd(e) {
    e.preventDefault();
    setClinics((p) => [
      ...p,
      {
        id: Date.now(),
        ...form,
        status: "amber",
        sLabel: "Pending",
        doctors: 0,
        appts: 0,
      },
    ]);
    setForm(MODAL_INIT);
    setShowModal(false);
  }

  function toggleStatus(id) {
    setClinics((p) =>
      p.map((c) =>
        c.id === id
          ? {
              ...c,
              status: c.sLabel === "Active" ? "red" : "active",
              sLabel: c.sLabel === "Active" ? "Inactive" : "Active",
            }
          : c,
      ),
    );
  }

  return (
    <div className="adm-shell">
      <AdminSidebar />
      <div className="adm-main">
        <AdminTopbar
          title="Clinic Management"
          searchPlaceholder="Search clinics..."
        />
        <div className="adm-content">
          <div className="adm-page-header">
            <div className="adm-page-header-left">
              <h1>Clinic management</h1>
              <p>
                Create and manage clinic branches, and monitor doctor-clinic
                associations.
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
                <i className="ti ti-building-plus" aria-hidden="true" /> New
                clinic
              </button>
            </div>
          </div>

          {/* Stats */}
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
                label: "Total clinics",
                num: clinics.length,
                color: "var(--adm-text-primary)",
              },
              {
                label: "Active",
                num: clinics.filter((c) => c.sLabel === "Active").length,
                color: "var(--adm-green)",
              },
              {
                label: "Inactive",
                num: clinics.filter((c) => c.sLabel === "Inactive").length,
                color: "var(--adm-red)",
              },
              {
                label: "Total doctors",
                num: clinics.reduce((a, c) => a + c.doctors, 0),
                color: "var(--adm-text-primary)",
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

          {/* Tabs */}
          <div className="adm-tabs">
            <button
              className={`adm-tab${tab === "clinics" ? " active" : ""}`}
              onClick={() => setTab("clinics")}
            >
              Clinics
            </button>
            <button
              className={`adm-tab${tab === "associations" ? " active" : ""}`}
              onClick={() => setTab("associations")}
            >
              Doctor-clinic associations
            </button>
          </div>

          {/* Clinics table */}
          {tab === "clinics" && (
            <div className="adm-card">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Clinic</th>
                    <th>Location</th>
                    <th>Manager</th>
                    <th>Doctors</th>
                    <th>Appointments</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {clinics.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <div>
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
                        </div>
                      </td>
                      <td
                        style={{
                          fontSize: 12,
                          color: "var(--adm-text-secondary)",
                        }}
                      >
                        {c.city} · {c.address}
                      </td>
                      <td
                        style={{
                          fontSize: 12,
                          color: "var(--adm-text-secondary)",
                        }}
                      >
                        {c.manager}
                      </td>
                      <td style={{ fontSize: 13, fontWeight: 500 }}>
                        {c.doctors}
                      </td>
                      <td style={{ fontSize: 13, fontWeight: 500 }}>
                        {c.appts}
                      </td>
                      <td>
                        <span className={`adm-badge adm-badge-${c.status}`}>
                          {c.sLabel}
                        </span>
                      </td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            gap: 6,
                            justifyContent: "flex-end",
                          }}
                        >
                          <button className="adm-icon-btn" title="Edit">
                            <i className="ti ti-edit" aria-hidden="true" />
                          </button>
                          <button
                            className={`adm-btn ${c.sLabel === "Active" ? "adm-btn-red" : "adm-btn-green"}`}
                            style={{ padding: "5px 10px", fontSize: 11 }}
                            onClick={() => toggleStatus(c.id)}
                          >
                            {c.sLabel === "Active" ? "Deactivate" : "Activate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="adm-table-footer">
                <span>Showing {clinics.length} clinics</span>
                <div className="adm-pagination">
                  <button className="adm-page-btn active">1</button>
                </div>
              </div>
            </div>
          )}

          {/* Associations table */}
          {tab === "associations" && (
            <div className="adm-card">
              <div className="adm-card-header">
                <h2 className="adm-card-title">Doctor-clinic associations</h2>
                <button
                  className="adm-btn adm-btn-dark"
                  style={{ padding: "6px 12px", fontSize: 12 }}
                >
                  <i className="ti ti-plus" aria-hidden="true" /> Assign doctor
                </button>
              </div>
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Doctor</th>
                    <th>Specialty</th>
                    <th>Clinic</th>
                    <th>Since</th>
                    <th>Primary</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {ASSOC_DATA.map((a, i) => (
                    <tr key={i}>
                      <td>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>
                          {a.doctor}
                        </div>
                      </td>
                      <td
                        style={{
                          fontSize: 12,
                          color: "var(--adm-text-secondary)",
                        }}
                      >
                        {a.spec}
                      </td>
                      <td
                        style={{
                          fontSize: 12,
                          color: "var(--adm-text-secondary)",
                        }}
                      >
                        {a.clinic}
                      </td>
                      <td
                        style={{ fontSize: 12, color: "var(--adm-text-muted)" }}
                      >
                        {a.since}
                      </td>
                      <td>
                        {a.primary ? (
                          <span className="adm-badge adm-badge-teal">
                            Primary
                          </span>
                        ) : (
                          <span className="adm-badge adm-badge-gray">
                            Secondary
                          </span>
                        )}
                      </td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            gap: 6,
                            justifyContent: "flex-end",
                          }}
                        >
                          <button className="adm-icon-btn">
                            <i className="ti ti-edit" aria-hidden="true" />
                          </button>
                          <button
                            className="adm-btn adm-btn-red"
                            style={{ padding: "5px 10px", fontSize: 11 }}
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* New Clinic Modal */}
      {showModal && (
        <div
          className="adm-modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="adm-modal">
            <div className="adm-modal-header">
              <div>
                <h2>Create new clinic</h2>
                <p>Add a new branch to the MediCenter network.</p>
              </div>
              <button
                className="adm-icon-btn"
                onClick={() => setShowModal(false)}
              >
                <i className="ti ti-x" aria-hidden="true" />
              </button>
            </div>
            <form onSubmit={handleAdd}>
              <div className="adm-modal-body">
                <div className="adm-field">
                  <label className="adm-label">Clinic name</label>
                  <input
                    className="adm-input"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="West Side Clinic"
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
                    <label className="adm-label">City</label>
                    <input
                      className="adm-input"
                      name="city"
                      value={form.city}
                      onChange={handleChange}
                      placeholder="New York"
                      required
                    />
                  </div>
                  <div className="adm-field">
                    <label className="adm-label">Phone</label>
                    <input
                      className="adm-input"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="+1 212-555-0000"
                    />
                  </div>
                </div>
                <div className="adm-field">
                  <label className="adm-label">Address</label>
                  <input
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
                    <label className="adm-label">Clinic manager</label>
                    <input
                      className="adm-input"
                      name="manager"
                      value={form.manager}
                      onChange={handleChange}
                      placeholder="Jane Doe"
                    />
                  </div>
                  <div className="adm-field">
                    <label className="adm-label">Max capacity</label>
                    <input
                      className="adm-input"
                      name="capacity"
                      type="number"
                      value={form.capacity}
                      onChange={handleChange}
                      placeholder="50"
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
                  Cancel
                </button>
                <button type="submit" className="adm-btn adm-btn-dark">
                  Create clinic
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
