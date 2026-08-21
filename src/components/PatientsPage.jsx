import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { useTranslation } from "../i18n/useTranslation";
import "./styles/Layout.css";
import "./styles/Patients.css";
import "./styles/Appointments.css";
import { searchPatients } from "../api/Patients";

function initialsOf(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return `${first}${last}`.toUpperCase() || "?";
}

function PatientPanel({ patient, onClose, onBook, t }) {
  return (
    <aside className="patient-panel">
      <div className="panel-header">
        <h3>{t("patients.patientOverview")}</h3>
        <button
          className="panel-close"
          onClick={onClose}
          aria-label="Close panel"
        >
          <i className="ti ti-x" aria-hidden="true" />
        </button>
      </div>

      <div className="panel-avatar-section">
        <div className="panel-avatar">{initialsOf(patient.name)}</div>
        <h2 className="panel-patient-name">{patient.name}</h2>
        <p className="panel-patient-meta">{t("patients.patientHash")}{patient.id}</p>
      </div>

      <div className="panel-section">
        <div className="panel-section-row">
          <div className="panel-section-icon amber">
            <i className="ti ti-phone" aria-hidden="true" />
          </div>
          <div>
            <div className="panel-section-label">{t("patients.phone")}</div>
            <div className="panel-section-value">{patient.phone || "—"}</div>
          </div>
        </div>
      </div>

      <div className="panel-section">
        <div className="panel-section-row">
          <div className="panel-section-icon amber">
            <i className="ti ti-id" aria-hidden="true" />
          </div>
          <div>
            <div className="panel-section-label">{t("patients.idCardNumber")}</div>
            <div className="panel-section-value">
              {patient.id_card_number || "—"}
            </div>
          </div>
        </div>
      </div>

      <div className="panel-section">
        <div className="panel-section-row">
          <div className="panel-section-icon amber">
            <i className="ti ti-gender-bigender" aria-hidden="true" />
          </div>
          <div>
            <div className="panel-section-label">{t("patients.gender")}</div>
            <div className="panel-section-value">{patient.gender || "—"}</div>
          </div>
        </div>
      </div>

      <div className="panel-section">
        <div className="panel-section-row">
          <div className="panel-section-icon amber">
            <i className="ti ti-cake" aria-hidden="true" />
          </div>
          <div>
            <div className="panel-section-label">{t("patients.dob")}</div>
            <div className="panel-section-value">{patient.dob || "—"}</div>
          </div>
        </div>
      </div>

      <div className="panel-actions">
        <div className="panel-actions-row">
          <button className="btn-full dark" onClick={() => onBook(patient)}>
            <i className="ti ti-calendar-plus" aria-hidden="true" />
            {t("patients.bookAppointment")}
          </button>
        </div>
      </div>

      <p className="panel-note">{t("patients.chartNote")}</p>
    </aside>
  );
}

export default function PatientsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setSearchError("");
      return;
    }
    setSearching(true);
    setSearchError("");
    const handle = setTimeout(() => {
      searchPatients(query.trim())
        .then(setResults)
        .catch((err) =>
          setSearchError(err.message || "Couldn't search patients."),
        )
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(handle);
  }, [query]);

  function selectPatient(p) {
    setSelected((prev) => (prev?.id === p.id ? null : p));
  }

  function handleBook(patient) {
    navigate("/appointments", { state: { prefillPatient: patient } });
  }

  return (
    <div className="layout-shell">
      <Sidebar />
      <div className="layout-main">
        <Topbar searchPlaceholder={t("topbar.searchDefault")} />
        <main className="page-content">
          <div className="patients-toolbar">
            <div>
              <h1
                style={{
                  fontFamily: "'DM Serif Display', serif",
                  fontSize: 26,
                  fontWeight: 400,
                  margin: "0 0 4px",
                  color: "var(--text-primary)",
                }}
              >
                {t("patients.directoryTitle")}
              </h1>
              <p
                style={{
                  fontSize: 14,
                  color: "var(--text-secondary)",
                  margin: 0,
                  fontWeight: 300,
                }}
              >
                {t("patients.directorySub")}
              </p>
            </div>
          </div>

          <div
            className="modal-search"
            style={{ maxWidth: 480, marginBottom: 20 }}
          >
            <i className="ti ti-search" aria-hidden="true" />
            <input
              type="text"
              placeholder={t("patients.searchPlaceholder")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
          </div>

          {searchError && (
            <div className="apt-banner apt-banner-error">{searchError}</div>
          )}

          <div className={`patients-layout${selected ? " panel-open" : ""}`}>
            <div className="card">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t("reception.patient")}</th>
                    <th>{t("patients.phone")}</th>
                    <th>{t("patients.idCardNumber")}</th>
                    <th>{t("patients.gender")}</th>
                    <th>{t("patients.dob")}</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((p) => (
                    <tr
                      key={p.id}
                      className={selected?.id === p.id ? "row-selected" : ""}
                      onClick={() => selectPatient(p)}
                    >
                      <td>
                        <div className="patient-cell">
                          <div className="patient-avatar">
                            {initialsOf(p.name)}
                          </div>
                          <div>
                            <div className="patient-name">{p.name}</div>
                            <div className="patient-id">#{p.id}</div>
                          </div>
                        </div>
                      </td>
                      <td
                        style={{ fontSize: 13, color: "var(--text-secondary)" }}
                      >
                        {p.phone || "—"}
                      </td>
                      <td
                        style={{ fontSize: 13, color: "var(--text-secondary)" }}
                      >
                        {p.id_card_number || "—"}
                      </td>
                      <td
                        style={{ fontSize: 13, color: "var(--text-secondary)" }}
                      >
                        {p.gender || "—"}
                      </td>
                      <td
                        style={{ fontSize: 13, color: "var(--text-secondary)" }}
                      >
                        {p.dob || "—"}
                      </td>
                    </tr>
                  ))}
                  {!searching &&
                    query.trim().length >= 2 &&
                    results.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          style={{
                            textAlign: "center",
                            padding: 24,
                            color: "var(--text-muted)",
                          }}
                        >
                          {t("patients.noPatientsFound")}
                        </td>
                      </tr>
                    )}
                  {query.trim().length < 2 && (
                    <tr>
                      <td
                        colSpan={5}
                        style={{
                          textAlign: "center",
                          padding: 24,
                          color: "var(--text-muted)",
                        }}
                      >
                        {t("patients.startTyping")}
                      </td>
                    </tr>
                  )}
                  {searching && (
                    <tr>
                      <td
                        colSpan={5}
                        style={{
                          textAlign: "center",
                          padding: 24,
                          color: "var(--text-muted)",
                        }}
                      >
                        {t("patients.searching")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {selected && (
              <PatientPanel
                patient={selected}
                onClose={() => setSelected(null)}
                onBook={handleBook}
                t={t}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
