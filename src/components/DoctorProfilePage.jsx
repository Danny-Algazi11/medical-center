import { useState, useEffect, useRef } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import {
  getDoctorProfile,
  updateDoctorProfile,
  uploadDoctorPhoto,
  uploadDoctorCertificate,
  updateClinicFee,
  joinClinic,
  createClinic,
} from "../api/doctor";
import "./styles/Layout.css";
import "./styles/DoctorProfile.css";

const STATUS_META = {
  verified: { label: "Verified", cls: "dp-badge-green" },
  pending: { label: "Pending review", cls: "dp-badge-amber" },
  rejected: { label: "Rejected", cls: "dp-badge-red" },
  suspended: { label: "Suspended", cls: "dp-badge-red" },
};

function initialsOf(first, last) {
  return `${first?.[0] || ""}${last?.[0] || ""}`.toUpperCase() || "?";
}

// Guards against rendering a non-image file (e.g. a PDF accidentally
// uploaded to the photo field) inside an <img> tag, which just shows a
// broken image icon since browsers can't render PDFs that way.
function isImageUrl(url) {
  return !!url && /\.(jpe?g|png|gif|webp|avif|svg)$/i.test(url);
}

export default function DoctorProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveOk, setSaveOk] = useState(false);

  const [photoUploading, setPhotoUploading] = useState(false);
  const [certUploading, setCertUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const photoInputRef = useRef(null);
  const certInputRef = useRef(null);

  const [editingClinicId, setEditingClinicId] = useState(null);
  const [clinicFeeDraft, setClinicFeeDraft] = useState("");
  const [clinicFeeSaving, setClinicFeeSaving] = useState(false);
  const [clinicFeeError, setClinicFeeError] = useState("");

  const [clinicPanel, setClinicPanel] = useState(null); // null | "join" | "create"

  const [joinForm, setJoinForm] = useState({
    clinic_code: "",
    consultation_fee: "",
  });
  const [joinSaving, setJoinSaving] = useState(false);
  const [joinError, setJoinError] = useState("");

  const [createForm, setCreateForm] = useState({
    clinic_name: "",
    clinic_address: "",
    clinic_phone: "",
    latitude: "",
    longitude: "",
    consultation_fee: "",
  });
  const [createLicenseFile, setCreateLicenseFile] = useState(null);
  const [createSaving, setCreateSaving] = useState(false);
  const [createError, setCreateError] = useState("");

  function load() {
    setLoading(true);
    setLoadError("");
    getDoctorProfile()
      .then((data) => setProfile(data))
      .catch((err) =>
        setLoadError(err.message || "Couldn't load your profile."),
      )
      .finally(() => setLoading(false));
  }

  // Re-fetches the canonical profile without toggling the full-page loading
  // state. Used after mutations whose own response can't always be trusted
  // to have every relation loaded (e.g. joinClinic's backend response is
  // currently missing the `account` block — see handleJoinClinic below).
  function refreshProfile() {
    return getDoctorProfile().then((data) => setProfile(data));
  }

  useEffect(load, []);

  function startEditing() {
    setForm({
      first_name: profile.account.first_name || "",
      last_name: profile.account.last_name || "",
      phone: profile.account.phone || "",
      address: profile.account.address || "",
      biography: profile.profile?.biography || "",
      online_consultation_fee: profile.profile?.online_consultation_fee ?? "",
      languages: (profile.profile?.languages || []).join(", "),
      qualifications:
        profile.profile?.qualifications?.length > 0
          ? profile.profile.qualifications.map((q) => ({ ...q }))
          : [{ degree: "", institution: "", year: "" }],
    });
    setSaveError("");
    setSaveOk(false);
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
    setForm(null);
    setSaveError("");
  }

  function updateField(key, value) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  function updateQualification(i, key, value) {
    setForm((p) => {
      const next = [...p.qualifications];
      next[i] = { ...next[i], [key]: value };
      return { ...p, qualifications: next };
    });
  }

  function addQualification() {
    setForm((p) => ({
      ...p,
      qualifications: [
        ...p.qualifications,
        { degree: "", institution: "", year: "" },
      ],
    }));
  }

  function removeQualification(i) {
    setForm((p) => ({
      ...p,
      qualifications: p.qualifications.filter((_, idx) => idx !== i),
    }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setSaveError("");
    try {
      const payload = {
        first_name: form.first_name,
        last_name: form.last_name,
        phone: form.phone,
        address: form.address,
        biography: form.biography,
        online_consultation_fee:
          form.online_consultation_fee === ""
            ? undefined
            : Number(form.online_consultation_fee),
        languages: form.languages
          .split(",")
          .map((l) => l.trim())
          .filter(Boolean),
        qualifications: form.qualifications
          .filter((q) => q.degree || q.institution || q.year)
          .map((q) => ({ ...q, year: Number(q.year) })),
      };
      const updated = await updateDoctorProfile(payload);
      setProfile(updated);
      setEditing(false);
      setSaveOk(true);
      window.setTimeout(() => setSaveOk(false), 2500);
    } catch (err) {
      setSaveError(
        err.errors
          ? Object.values(err.errors)[0][0]
          : err.message || "Couldn't save changes.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handlePhotoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoUploading(true);
    setUploadError("");
    try {
      const updated = await uploadDoctorPhoto(file);
      setProfile(updated);
    } catch (err) {
      setUploadError(err.message || "Couldn't upload photo.");
    } finally {
      setPhotoUploading(false);
      e.target.value = "";
    }
  }

  async function handleCertChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setCertUploading(true);
    setUploadError("");
    try {
      const updated = await uploadDoctorCertificate(file);
      setProfile(updated);
    } catch (err) {
      setUploadError(err.message || "Couldn't upload certificate.");
    } finally {
      setCertUploading(false);
      e.target.value = "";
    }
  }

  function startEditingClinicFee(clinic) {
    setEditingClinicId(clinic.id);
    setClinicFeeDraft(
      clinic.consultation_fee === null || clinic.consultation_fee === undefined
        ? ""
        : String(clinic.consultation_fee),
    );
    setClinicFeeError("");
  }

  function cancelEditingClinicFee() {
    setEditingClinicId(null);
    setClinicFeeDraft("");
    setClinicFeeError("");
  }

  async function saveClinicFee(clinicId) {
    if (clinicFeeDraft === "" || Number.isNaN(Number(clinicFeeDraft))) {
      setClinicFeeError("Enter a valid fee.");
      return;
    }
    setClinicFeeSaving(true);
    setClinicFeeError("");
    try {
      const updated = await updateClinicFee(clinicId, Number(clinicFeeDraft));
      setProfile(updated);
      setEditingClinicId(null);
      setClinicFeeDraft("");
    } catch (err) {
      setClinicFeeError(
        err.errors
          ? Object.values(err.errors)[0][0]
          : err.message || "Couldn't update fee.",
      );
    } finally {
      setClinicFeeSaving(false);
    }
  }

  function openClinicPanel(panel) {
    setClinicPanel(panel);
    setJoinError("");
    setCreateError("");
  }

  function closeClinicPanel() {
    setClinicPanel(null);
    setJoinForm({ clinic_code: "", consultation_fee: "" });
    setCreateForm({
      clinic_name: "",
      clinic_address: "",
      clinic_phone: "",
      latitude: "",
      longitude: "",
      consultation_fee: "",
    });
    setCreateLicenseFile(null);
    setJoinError("");
    setCreateError("");
  }

  async function handleJoinClinic(e) {
    e.preventDefault();
    setJoinSaving(true);
    setJoinError("");
    try {
      await joinClinic({
        clinic_code: joinForm.clinic_code.trim(),
        consultation_fee: Number(joinForm.consultation_fee),
      });
      // Not using the response here on purpose — the backend's joinClinic
      // endpoint currently doesn't eager-load `user`, so its `account`
      // block is missing entirely. Re-fetch instead of trusting it.
      await refreshProfile();
      closeClinicPanel();
    } catch (err) {
      setJoinError(
        err.errors
          ? Object.values(err.errors)[0][0]
          : err.message || "Couldn't join clinic.",
      );
    } finally {
      setJoinSaving(false);
    }
  }

  async function handleCreateClinic(e) {
    e.preventDefault();
    if (!createLicenseFile) {
      setCreateError("Clinic license file is required.");
      return;
    }
    setCreateSaving(true);
    setCreateError("");
    try {
      const updated = await createClinic({
        ...createForm,
        clinic_license_file: createLicenseFile,
      });
      setProfile(updated);
      closeClinicPanel();
    } catch (err) {
      setCreateError(
        err.errors
          ? Object.values(err.errors)[0][0]
          : err.message || "Couldn't create clinic.",
      );
    } finally {
      setCreateSaving(false);
    }
  }

  return (
    <div className="layout-shell">
      <Sidebar />
      <div className="layout-main">
        <Topbar searchPlaceholder="Search..." />

        <main className="page-content dp-content">
          {loading && <div className="dp-loading">Loading your profile…</div>}

          {!loading && loadError && (
            <div className="dp-error-block">
              {loadError}{" "}
              <button className="dp-retry-btn" onClick={load}>
                Retry
              </button>
            </div>
          )}

          {!loading && profile && (
            <>
              {/* ── Header ── */}
              <div className="dp-header card">
                <div className="dp-header-left">
                  <div className="dp-avatar-wrap">
                    {isImageUrl(profile.documents?.photo_url) ? (
                      <img
                        src={profile.documents.photo_url}
                        alt=""
                        className="dp-avatar-img"
                      />
                    ) : (
                      <div className="dp-avatar-fallback">
                        {initialsOf(
                          profile.account?.first_name,
                          profile.account?.last_name,
                        )}
                      </div>
                    )}
                    <button
                      className="dp-avatar-edit"
                      onClick={() => photoInputRef.current?.click()}
                      disabled={photoUploading}
                      title="Change photo"
                    >
                      <i className="ti ti-camera" aria-hidden="true" />
                    </button>
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={handlePhotoChange}
                    />
                  </div>
                  <div>
                    <h1 className="dp-name">
                      Dr. {profile.account?.full_name}
                    </h1>
                    <div className="dp-email">{profile.account?.email}</div>
                    <span
                      className={`dp-badge ${STATUS_META[profile.verification?.status]?.cls || "dp-badge-gray"}`}
                    >
                      {STATUS_META[profile.verification?.status]?.label ||
                        profile.verification?.status}
                    </span>
                  </div>
                </div>
                {!editing && (
                  <button className="dp-btn dp-btn-dark" onClick={startEditing}>
                    <i className="ti ti-edit" aria-hidden="true" /> Edit profile
                  </button>
                )}
              </div>

              {photoUploading && (
                <div className="dp-hint">Uploading photo…</div>
              )}
              {uploadError && (
                <div className="dp-error-inline">{uploadError}</div>
              )}
              {saveOk && (
                <div className="dp-success-inline">Profile updated.</div>
              )}

              {editing ? (
                <form onSubmit={handleSave}>
                  {saveError && (
                    <div className="dp-error-inline">{saveError}</div>
                  )}

                  <section className="card dp-section">
                    <div className="card-header">
                      <h2 className="card-title">Personal information</h2>
                    </div>
                    <div className="dp-section-body dp-grid-2">
                      <div className="dp-field">
                        <label className="dp-label">First name</label>
                        <input
                          className="dp-input"
                          value={form.first_name}
                          onChange={(e) =>
                            updateField("first_name", e.target.value)
                          }
                        />
                      </div>
                      <div className="dp-field">
                        <label className="dp-label">Last name</label>
                        <input
                          className="dp-input"
                          value={form.last_name}
                          onChange={(e) =>
                            updateField("last_name", e.target.value)
                          }
                        />
                      </div>
                      <div className="dp-field">
                        <label className="dp-label">Phone</label>
                        <input
                          className="dp-input"
                          value={form.phone}
                          onChange={(e) => updateField("phone", e.target.value)}
                        />
                      </div>
                      <div className="dp-field">
                        <label className="dp-label">Address</label>
                        <input
                          className="dp-input"
                          value={form.address}
                          onChange={(e) =>
                            updateField("address", e.target.value)
                          }
                        />
                      </div>
                    </div>
                  </section>

                  <section className="card dp-section">
                    <div className="card-header">
                      <h2 className="card-title">Professional details</h2>
                    </div>
                    <div className="dp-section-body">
                      <div className="dp-field">
                        <label className="dp-label">Biography</label>
                        <textarea
                          className="dp-input dp-textarea"
                          rows={4}
                          maxLength={2000}
                          value={form.biography}
                          onChange={(e) =>
                            updateField("biography", e.target.value)
                          }
                        />
                      </div>
                      <div className="dp-grid-2">
                        <div className="dp-field">
                          <label className="dp-label">Consultation fee</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            className="dp-input"
                            value={form.online_consultation_fee}
                            onChange={(e) =>
                              updateField(
                                "online_consultation_fee",
                                e.target.value,
                              )
                            }
                          />
                        </div>
                        <div className="dp-field">
                          <label className="dp-label">
                            Languages (comma-separated, e.g. ar, en)
                          </label>
                          <input
                            className="dp-input"
                            value={form.languages}
                            onChange={(e) =>
                              updateField("languages", e.target.value)
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="card dp-section">
                    <div className="card-header">
                      <h2 className="card-title">Qualifications</h2>
                    </div>
                    <div className="dp-section-body">
                      {form.qualifications.map((q, i) => (
                        <div className="dp-qual-row" key={i}>
                          <input
                            className="dp-input"
                            placeholder="Degree"
                            value={q.degree}
                            onChange={(e) =>
                              updateQualification(i, "degree", e.target.value)
                            }
                          />
                          <input
                            className="dp-input"
                            placeholder="Institution"
                            value={q.institution}
                            onChange={(e) =>
                              updateQualification(
                                i,
                                "institution",
                                e.target.value,
                              )
                            }
                          />
                          <input
                            type="number"
                            min="1950"
                            className="dp-input dp-qual-year"
                            placeholder="Year"
                            value={q.year}
                            onChange={(e) =>
                              updateQualification(i, "year", e.target.value)
                            }
                          />
                          <button
                            type="button"
                            className="dp-icon-btn"
                            onClick={() => removeQualification(i)}
                            aria-label="Remove"
                          >
                            <i className="ti ti-trash" aria-hidden="true" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        className="dp-btn dp-btn-outline"
                        onClick={addQualification}
                      >
                        <i className="ti ti-plus" aria-hidden="true" /> Add
                        qualification
                      </button>
                    </div>
                  </section>

                  <div className="dp-form-actions">
                    <button
                      type="button"
                      className="dp-btn dp-btn-outline"
                      onClick={cancelEditing}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="dp-btn dp-btn-dark"
                      disabled={saving}
                    >
                      {saving ? "Saving…" : "Save changes"}
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <section className="card dp-section">
                    <div className="card-header">
                      <h2 className="card-title">Personal information</h2>
                    </div>
                    <div className="dp-section-body dp-grid-2">
                      <div className="dp-readfield">
                        <span>Phone</span>
                        <strong>{profile.account?.phone || "—"}</strong>
                      </div>
                      <div className="dp-readfield">
                        <span>Address</span>
                        <strong>{profile.account?.address || "—"}</strong>
                      </div>
                      <div className="dp-readfield">
                        <span>Date of birth</span>
                        <strong>{profile.account?.dob || "—"}</strong>
                      </div>
                      <div className="dp-readfield">
                        <span>Gender</span>
                        <strong style={{ textTransform: "capitalize" }}>
                          {profile.account?.gender || "—"}
                        </strong>
                      </div>
                    </div>
                  </section>

                  <section className="card dp-section">
                    <div className="card-header">
                      <h2 className="card-title">Professional details</h2>
                    </div>
                    <div className="dp-section-body">
                      <p className="dp-bio">
                        {profile.profile?.biography ||
                          "No biography added yet."}
                      </p>
                      <div className="dp-grid-3">
                        <div className="dp-readfield">
                          <span>Online Consultation fee</span>
                          <strong>
                            {profile.profile?.online_consultation_fee ?? "—"}
                          </strong>
                        </div>
                        <div className="dp-readfield">
                          <span>Practice start</span>
                          <strong>
                            {profile.career?.practice_start_date?.slice(
                              0,
                              10,
                            ) || "—"}
                          </strong>
                        </div>
                        <div className="dp-readfield">
                          <span>Experience</span>
                          <strong>
                            {profile.career?.experience_years ?? "—"} yrs
                          </strong>
                        </div>
                      </div>
                      <div className="dp-chips">
                        {(profile.profile?.languages || []).map((l) => (
                          <span className="dp-chip" key={l}>
                            {l.toUpperCase()}
                          </span>
                        ))}
                      </div>
                    </div>
                  </section>

                  <section className="card dp-section">
                    <div className="card-header">
                      <h2 className="card-title">Qualifications</h2>
                    </div>
                    <div className="dp-section-body">
                      {profile.profile?.qualifications?.length > 0 ? (
                        profile.profile.qualifications.map((q, i) => (
                          <div className="dp-qual-display" key={i}>
                            <div className="dp-qual-degree">{q.degree}</div>
                            <div className="dp-qual-meta">
                              {q.institution} · {q.year}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="dp-empty">No qualifications added yet.</p>
                      )}
                    </div>
                  </section>

                  <section className="card dp-section">
                    <div className="card-header">
                      <h2 className="card-title">Documents</h2>
                    </div>
                    <div className="dp-section-body">
                      <div className="dp-doc-grid">
                        <a
                          className="dp-doc-link"
                          href={profile.documents?.license_file_url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <i
                            className="ti ti-file-certificate"
                            aria-hidden="true"
                          />{" "}
                          License file
                        </a>
                        <a
                          className="dp-doc-link"
                          href={profile.documents?.id_card_url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <i className="ti ti-id" aria-hidden="true" /> ID card
                        </a>
                        {(profile.documents?.certificate_urls || []).map(
                          (url, i) => (
                            <a
                              className="dp-doc-link"
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              key={url}
                            >
                              <i
                                className="ti ti-certificate"
                                aria-hidden="true"
                              />{" "}
                              Certificate {i + 1}
                            </a>
                          ),
                        )}
                      </div>
                      <button
                        type="button"
                        className="dp-btn dp-btn-outline"
                        style={{ marginTop: 14 }}
                        onClick={() => certInputRef.current?.click()}
                        disabled={certUploading}
                      >
                        <i className="ti ti-upload" aria-hidden="true" />
                        {certUploading ? "Uploading…" : "Add certificate"}
                      </button>
                      <input
                        ref={certInputRef}
                        type="file"
                        accept="image/*,.pdf"
                        hidden
                        onChange={handleCertChange}
                      />
                    </div>
                  </section>

                  <section className="card dp-section">
                    <div className="card-header">
                      <h2 className="card-title">Departments &amp; clinics</h2>
                    </div>
                    <div className="dp-section-body">
                      <div className="dp-chips" style={{ marginBottom: 14 }}>
                        {(profile.departments || []).map((d) => (
                          <span className="dp-chip dp-chip-dept" key={d.id}>
                            {d.name}
                          </span>
                        ))}
                      </div>
                      {(profile.clinics || []).map((c) => (
                        <div className="dp-clinic-row" key={c.id}>
                          <div className="dp-clinic-row-top">
                            <div>
                              <div className="dp-clinic-name">{c.name}</div>
                              <div className="dp-clinic-meta">
                                {c.address} {c.phone ? `· ${c.phone}` : ""}
                              </div>
                            </div>

                            {editingClinicId !== c.id && (
                              <div className="dp-clinic-fee">
                                <span className="dp-clinic-fee-label">
                                  Consultation fee
                                </span>
                                <span className="dp-clinic-fee-value">
                                  {c.consultation_fee ?? "—"}
                                </span>
                                <button
                                  type="button"
                                  className="dp-clinic-fee-edit"
                                  onClick={() => startEditingClinicFee(c)}
                                >
                                  Edit
                                </button>
                              </div>
                            )}
                          </div>

                          {editingClinicId === c.id && (
                            <div className="dp-clinic-fee-editor">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                className="dp-input"
                                value={clinicFeeDraft}
                                onChange={(e) =>
                                  setClinicFeeDraft(e.target.value)
                                }
                                autoFocus
                              />
                              <button
                                type="button"
                                className="dp-btn dp-btn-dark dp-btn-sm"
                                disabled={clinicFeeSaving}
                                onClick={() => saveClinicFee(c.id)}
                              >
                                {clinicFeeSaving ? "Saving…" : "Save"}
                              </button>
                              <button
                                type="button"
                                className="dp-btn dp-btn-outline dp-btn-sm"
                                disabled={clinicFeeSaving}
                                onClick={cancelEditingClinicFee}
                              >
                                Cancel
                              </button>
                              {clinicFeeError && (
                                <span className="dp-clinic-fee-error">
                                  {clinicFeeError}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      ))}

                      {clinicPanel === null && (
                        <div className="dp-clinic-actions">
                          <button
                            type="button"
                            className="dp-btn dp-btn-outline dp-btn-sm"
                            onClick={() => openClinicPanel("join")}
                          >
                            <i className="ti ti-plus" aria-hidden="true" /> Join
                            a clinic
                          </button>
                          <button
                            type="button"
                            className="dp-btn dp-btn-outline dp-btn-sm"
                            onClick={() => openClinicPanel("create")}
                          >
                            <i className="ti ti-plus" aria-hidden="true" />{" "}
                            Create a clinic
                          </button>
                        </div>
                      )}

                      {clinicPanel === "join" && (
                        <form
                          className="dp-clinic-panel"
                          onSubmit={handleJoinClinic}
                        >
                          <h3 className="dp-clinic-panel-title">
                            Join a clinic
                          </h3>
                          <div className="dp-grid-2">
                            <div className="dp-field">
                              <label className="dp-label">Clinic code</label>
                              <input
                                className="dp-input"
                                maxLength={10}
                                placeholder="10-character code"
                                value={joinForm.clinic_code}
                                onChange={(e) =>
                                  setJoinForm((p) => ({
                                    ...p,
                                    clinic_code: e.target.value,
                                  }))
                                }
                              />
                            </div>
                            <div className="dp-field">
                              <label className="dp-label">
                                Consultation fee at this clinic
                              </label>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                className="dp-input"
                                value={joinForm.consultation_fee}
                                onChange={(e) =>
                                  setJoinForm((p) => ({
                                    ...p,
                                    consultation_fee: e.target.value,
                                  }))
                                }
                              />
                            </div>
                          </div>
                          {joinError && (
                            <div className="dp-error-inline">{joinError}</div>
                          )}
                          <div className="dp-clinic-panel-actions">
                            <button
                              type="submit"
                              className="dp-btn dp-btn-dark dp-btn-sm"
                              disabled={joinSaving}
                            >
                              {joinSaving ? "Joining…" : "Join clinic"}
                            </button>
                            <button
                              type="button"
                              className="dp-btn dp-btn-outline dp-btn-sm"
                              onClick={closeClinicPanel}
                              disabled={joinSaving}
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      )}

                      {clinicPanel === "create" && (
                        <form
                          className="dp-clinic-panel"
                          onSubmit={handleCreateClinic}
                        >
                          <h3 className="dp-clinic-panel-title">
                            Create a clinic
                          </h3>
                          <div className="dp-grid-2">
                            <div className="dp-field">
                              <label className="dp-label">Clinic name</label>
                              <input
                                className="dp-input"
                                value={createForm.clinic_name}
                                onChange={(e) =>
                                  setCreateForm((p) => ({
                                    ...p,
                                    clinic_name: e.target.value,
                                  }))
                                }
                              />
                            </div>
                            <div className="dp-field">
                              <label className="dp-label">
                                Phone (optional)
                              </label>
                              <input
                                className="dp-input"
                                value={createForm.clinic_phone}
                                onChange={(e) =>
                                  setCreateForm((p) => ({
                                    ...p,
                                    clinic_phone: e.target.value,
                                  }))
                                }
                              />
                            </div>
                          </div>
                          <div className="dp-field">
                            <label className="dp-label">Address</label>
                            <input
                              className="dp-input"
                              value={createForm.clinic_address}
                              onChange={(e) =>
                                setCreateForm((p) => ({
                                  ...p,
                                  clinic_address: e.target.value,
                                }))
                              }
                            />
                          </div>
                          <div className="dp-grid-2">
                            <div className="dp-field">
                              <label className="dp-label">Latitude</label>
                              <input
                                type="number"
                                step="any"
                                className="dp-input"
                                placeholder="e.g. 33.5138"
                                value={createForm.latitude}
                                onChange={(e) =>
                                  setCreateForm((p) => ({
                                    ...p,
                                    latitude: e.target.value,
                                  }))
                                }
                              />
                            </div>
                            <div className="dp-field">
                              <label className="dp-label">Longitude</label>
                              <input
                                type="number"
                                step="any"
                                className="dp-input"
                                placeholder="e.g. 36.2765"
                                value={createForm.longitude}
                                onChange={(e) =>
                                  setCreateForm((p) => ({
                                    ...p,
                                    longitude: e.target.value,
                                  }))
                                }
                              />
                            </div>
                          </div>
                          <div className="dp-field">
                            <label className="dp-label">
                              Consultation fee at this clinic
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              className="dp-input"
                              value={createForm.consultation_fee}
                              onChange={(e) =>
                                setCreateForm((p) => ({
                                  ...p,
                                  consultation_fee: e.target.value,
                                }))
                              }
                            />
                          </div>
                          <div className="dp-field">
                            <label className="dp-label">
                              Clinic license file (PDF/JPG/PNG, max 5MB)
                            </label>
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) =>
                                setCreateLicenseFile(e.target.files[0] || null)
                              }
                            />
                          </div>
                          {createError && (
                            <div className="dp-error-inline">{createError}</div>
                          )}
                          <div className="dp-clinic-panel-actions">
                            <button
                              type="submit"
                              className="dp-btn dp-btn-dark dp-btn-sm"
                              disabled={createSaving}
                            >
                              {createSaving ? "Creating…" : "Create clinic"}
                            </button>
                            <button
                              type="button"
                              className="dp-btn dp-btn-outline dp-btn-sm"
                              onClick={closeClinicPanel}
                              disabled={createSaving}
                            >
                              Cancel
                            </button>
                          </div>
                          <p className="dp-note" style={{ marginTop: 10 }}>
                            New clinics go live as "pending" and need admin
                            approval before patients can book there.
                          </p>
                        </form>
                      )}

                      <p className="dp-note">
                        Leaving a department isn't available on this page yet —
                        that's coming in a follow-up.
                      </p>
                    </div>
                  </section>
                </>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
