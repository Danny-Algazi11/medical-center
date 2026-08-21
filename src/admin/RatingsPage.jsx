import { useState, useEffect, useCallback } from "react";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";
import { getDoctorPerformance, getDoctors, getDoctorReviews } from "../api/admin";
import { formatTimestamp } from "./auditFormat";
import { useTranslation } from "../i18n/useTranslation";
import "../components/styles/Admin.css";

function StarDisplay({ rating }) {
  return (
    <span className="adm-stars">
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          key={s}
          style={{ color: rating && s <= Math.round(rating) ? "#f59e0b" : "#ddd" }}
        >
          ★
        </span>
      ))}
    </span>
  );
}

function initialsOf(name) {
  const parts = (name || "").trim().split(/\s+/);
  return ((parts[0]?.[0] || "D") + (parts[1]?.[0] || "")).toUpperCase();
}

function statusColor(status) {
  const map = { pending: "amber", verified: "green", rejected: "red", suspended: "red" };
  return map[status] || "gray";
}
function statusLabel(status, t) {
  const map = {
    pending: t("adminCommon.pending"),
    verified: t("adminCommon.active"),
    rejected: t("adminCommon.rejected"),
    suspended: t("adminCommon.suspended"),
  };
  return map[status] || t("adminCommon.unknown");
}

export default function RatingsPage() {
  const { t } = useTranslation();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("All");

  const [selected, setSelected] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState("");

  const loadDoctors = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      // Performance endpoint has the rating/review aggregates but no
      // specialty/clinic/status — admin/doctors has those. Cross-reference
      // by id, same pattern used to link a clinic to its owning doctor.
      const [perfRes, doctorsRes] = await Promise.all([
        getDoctorPerformance({ per_page: 100 }),
        getDoctors({ per_page: 100 }),
      ]);

      const byId = new Map(
        (doctorsRes.data.data || []).map((d) => [d.id, d]),
      );

      setDoctors(
        (perfRes.data.data || []).map((p) => {
          const full = byId.get(p.doctor_id);
          return {
            id: p.doctor_id,
            name: p.name ? `Dr. ${p.name}` : "Unknown doctor",
            initials: initialsOf(p.name),
            spec: full?.departments?.[0]?.name || "—",
            clinic: full?.clinics?.[0]?.name || t("ratings.unassigned"),
            avgRating: p.average_rating,
            totalReviews: p.total_reviews,
            completedAppointments: p.completed_appointments,
            verification_status: full?.verification_status,
          };
        }),
      );
    } catch (err) {
      setError(err.message || "Failed to load doctor ratings");
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadDoctors();
  }, [loadDoctors]);

  async function selectDoctor(doctor) {
    if (selected?.id === doctor.id) {
      setSelected(null);
      return;
    }
    setSelected(doctor);
    setReviews([]);
    setReviewsError("");
    setReviewsLoading(true);
    try {
      const res = await getDoctorReviews(doctor.id, { per_page: 50 });
      setReviews(res.data.data || []);
    } catch (err) {
      setReviewsError(err.message || "Failed to load reviews");
    } finally {
      setReviewsLoading(false);
    }
  }

  const filtered = doctors.filter((d) => {
    if (filter === "Low") return d.avgRating != null && d.avgRating < 3.5;
    if (filter === "Unreviewed") return d.totalReviews === 0;
    return true;
  });

  const totalReviews = doctors.reduce((a, d) => a + (d.totalReviews || 0), 0);
  const rated = doctors.filter((d) => d.avgRating != null);
  const avgSystemRating = rated.length
    ? (rated.reduce((a, d) => a + d.avgRating, 0) / rated.length).toFixed(1)
    : "—";
  const lowRatedCount = doctors.filter((d) => d.avgRating != null && d.avgRating < 3.5).length;

  return (
    <div className="adm-shell">
      <AdminSidebar />
      <div className="adm-main">
        <AdminTopbar title={t("admin.ratings")} searchPlaceholder={t("adminCommon.searchDoctors")} />
        <div className="adm-content">
          {/* Header */}
          <div className="adm-page-header">
            <div className="adm-page-header-left">
              <h1>{t("ratings.title")}</h1>
              <p>{t("ratings.subtitle")}</p>
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

          {/* Stat cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4,1fr)",
              gap: 14,
              marginBottom: 20,
            }}
          >
            {[
              { label: t("ratings.totalReviews"), num: totalReviews, color: "var(--adm-text-primary)" },
              { label: t("ratings.avgSystemRating"), num: avgSystemRating, color: "var(--adm-text-primary)" },
              { label: t("ratings.doctors"), num: doctors.length, color: "var(--adm-text-primary)" },
              { label: t("ratings.lowRatedDoctors"), num: lowRatedCount, color: "var(--adm-amber)" },
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

          {/* Filter */}
          <div className="adm-filter-bar">
            {[
              { key: "All", label: t("ratings.all") },
              { key: "Low", label: t("ratings.lowRated") },
              { key: "Unreviewed", label: t("ratings.unreviewed") },
            ].map((f) => (
              <button
                key={f.key}
                className={`adm-btn ${filter === f.key ? "adm-btn-dark" : "adm-btn-outline"}`}
                style={{ padding: "6px 14px", fontSize: 12 }}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>

          {loading && (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <p>{t("ratings.loadingRatings")}</p>
            </div>
          )}

          {/* Two-col: table + detail */}
          {!loading && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: selected ? "1fr 380px" : "1fr",
                gap: 16,
              }}
            >
              {/* Doctor ratings table */}
              <div className="adm-card">
                <table className="adm-table">
                  <thead>
                    <tr>
                      <th>{t("ratings.doctor")}</th>
                      <th>{t("ratings.specialty")}</th>
                      <th>{t("ratings.rating")}</th>
                      <th>{t("ratings.reviews")}</th>
                      <th>{t("ratings.status")}</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((d) => (
                      <tr
                        key={d.id}
                        style={{
                          cursor: "pointer",
                          background: selected?.id === d.id ? "#f0f7f2" : "",
                        }}
                        onClick={() => selectDoctor(d)}
                      >
                        <td>
                          <div className="adm-cell">
                            <div className="adm-avatar">{d.initials}</div>
                            <div>
                              <div className="adm-cell-name">{d.name}</div>
                              <div className="adm-cell-sub">{d.clinic}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ fontSize: 12, color: "var(--adm-text-secondary)" }}>
                          {d.spec}
                        </td>
                        <td>
                          {d.avgRating != null ? (
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <StarDisplay rating={d.avgRating} />
                              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--adm-text-primary)" }}>
                                {d.avgRating}
                              </span>
                            </div>
                          ) : (
                            <span style={{ fontSize: 12, color: "var(--adm-text-muted)" }}>
                              {t("ratings.noRatings")}
                            </span>
                          )}
                        </td>
                        <td style={{ fontSize: 13, fontWeight: 500 }}>{d.totalReviews}</td>
                        <td>
                          <span className={`adm-badge adm-badge-${statusColor(d.verification_status)}`}>
                            {statusLabel(d.verification_status, t)}
                          </span>
                        </td>
                        <td>
                          <button className="adm-icon-btn">
                            <i className="ti ti-chevron-right" aria-hidden="true" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ textAlign: "center", padding: 24 }}>
                          {t("ratings.noDoctorsMatch")}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <div className="adm-table-footer">
                  <span>
                    {t("ratings.showing")} {filtered.length} {t("ratings.of")} {doctors.length} {t("ratings.doctorsWord")}
                  </span>
                </div>
              </div>

              {/* Detail panel */}
              {selected && (
                <div
                  className="adm-card"
                  style={{ height: "fit-content", position: "sticky", top: 86 }}
                >
                  <div className="adm-card-header">
                    <h2 className="adm-card-title">{t("ratings.doctorReviews")}</h2>
                    <button className="adm-icon-btn" onClick={() => setSelected(null)}>
                      <i className="ti ti-x" aria-hidden="true" />
                    </button>
                  </div>

                  {/* Doctor summary */}
                  <div
                    style={{
                      padding: "16px 18px",
                      borderBottom: "1px solid var(--adm-card-border)",
                    }}
                  >
                    <div className="adm-cell" style={{ marginBottom: 12 }}>
                      <div className="adm-avatar" style={{ width: 44, height: 44, fontSize: 15 }}>
                        {selected.initials}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--adm-text-primary)" }}>
                          {selected.name}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--adm-text-muted)" }}>
                          {selected.spec} · {selected.clinic}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      <div>
                        <div style={{ fontSize: 36, fontWeight: 700, color: "var(--adm-text-primary)", lineHeight: 1 }}>
                          {selected.avgRating ?? "—"}
                        </div>
                        <StarDisplay rating={selected.avgRating} />
                        <div style={{ fontSize: 11, color: "var(--adm-text-muted)", marginTop: 3 }}>
                          {selected.totalReviews} {t("ratings.reviews").toLowerCase()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Reviews list */}
                  <div style={{ maxHeight: 360, overflowY: "auto" }}>
                    {reviewsLoading && (
                      <div style={{ padding: 18, textAlign: "center", fontSize: 12, color: "var(--adm-text-muted)" }}>
                        {t("ratings.loadingReviews")}
                      </div>
                    )}
                    {reviewsError && (
                      <div style={{ padding: 18, fontSize: 12, color: "#c00" }}>{reviewsError}</div>
                    )}
                    {!reviewsLoading && !reviewsError && reviews.length === 0 && (
                      <div style={{ padding: 18, textAlign: "center", fontSize: 12, color: "var(--adm-text-muted)" }}>
                        {t("ratings.noReviewsYet")}
                      </div>
                    )}
                    {reviews.map((r) => (
                      <div
                        key={r.id}
                        style={{ padding: "14px 18px", borderBottom: "1px solid #f5f5f5" }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            justifyContent: "space-between",
                            marginBottom: 6,
                          }}
                        >
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--adm-text-primary)" }}>
                              {r.patient?.name || t("complaints.patient")}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                              <StarDisplay rating={r.rating} />
                              <span style={{ fontSize: 11, color: "var(--adm-text-muted)" }}>
                                {formatTimestamp(r.created_at)}
                              </span>
                            </div>
                          </div>
                        </div>
                        {r.comment && (
                          <div
                            style={{
                              fontSize: 12,
                              color: "var(--adm-text-secondary)",
                              lineHeight: 1.6,
                              fontWeight: 300,
                            }}
                          >
                            {r.comment}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
