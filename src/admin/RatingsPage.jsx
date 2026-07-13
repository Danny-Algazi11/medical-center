import { useState } from "react";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";
import "../components/styles/Admin.css";

const RATINGS_DATA = [
  {
    id: 1,
    initials: "DA",
    name: "Dr. Ahmad Karimi",
    spec: "Cardiology",
    clinic: "City Central",
    avgRating: 4.9,
    totalReviews: 124,
    stars: [2, 3, 8, 22, 89],
    status: "green",
    sLabel: "Active",
    reviews: [
      {
        id: 1,
        patient: "Michael Scott",
        rating: 5,
        date: "Jun 2, 2026",
        comment:
          "Excellent doctor, very thorough and professional. Explained everything clearly.",
        flagged: false,
      },
      {
        id: 2,
        patient: "Pam Beesly",
        rating: 5,
        date: "May 28, 2026",
        comment:
          "Very kind and patient. I felt heard and well cared for. Highly recommend.",
        flagged: false,
      },
      {
        id: 3,
        patient: "Jim Halpert",
        rating: 4,
        date: "May 20, 2026",
        comment:
          "Good experience overall. Wait time was a bit long but the consultation was great.",
        flagged: false,
      },
    ],
  },
  {
    id: 2,
    initials: "DC",
    name: "Dr. Michael Chen",
    spec: "Pediatrics",
    clinic: "City Central",
    avgRating: 4.6,
    totalReviews: 98,
    stars: [1, 4, 12, 31, 50],
    status: "green",
    sLabel: "Active",
    reviews: [
      {
        id: 1,
        patient: "Angela Martin",
        rating: 5,
        date: "Jun 1, 2026",
        comment:
          "Great with kids. My son was very comfortable. Very knowledgeable.",
        flagged: false,
      },
      {
        id: 2,
        patient: "Kevin Malone",
        rating: 4,
        date: "May 25, 2026",
        comment:
          "Solid doctor. Gave clear instructions and followed up promptly.",
        flagged: false,
      },
      {
        id: 3,
        patient: "Oscar Martinez",
        rating: 3,
        date: "May 10, 2026",
        comment:
          "Average experience. Felt a bit rushed during the consultation.",
        flagged: true,
      },
    ],
  },
  {
    id: 3,
    initials: "TA",
    name: "Dr. Tahani Al-Jamil",
    spec: "Dermatology",
    clinic: "North Branch",
    avgRating: 4.2,
    totalReviews: 76,
    stars: [2, 6, 14, 28, 26],
    status: "green",
    sLabel: "Active",
    reviews: [
      {
        id: 1,
        patient: "Dwight Schrute",
        rating: 4,
        date: "May 30, 2026",
        comment:
          "Very professional and knowledgeable about skin conditions. Happy with results.",
        flagged: false,
      },
      {
        id: 2,
        patient: "Ryan Howard",
        rating: 3,
        date: "May 18, 2026",
        comment:
          "Treatment worked but the doctor seemed distracted. Could improve bedside manner.",
        flagged: false,
      },
      {
        id: 3,
        patient: "Kelly Kapoor",
        rating: 2,
        date: "May 5, 2026",
        comment:
          "Felt dismissed. My concerns were not taken seriously. Would not return.",
        flagged: true,
      },
    ],
  },
  {
    id: 4,
    initials: "MK",
    name: "Dr. Marcus Kim",
    spec: "General",
    clinic: "East Branch",
    avgRating: 2.8,
    totalReviews: 44,
    stars: [12, 8, 10, 9, 5],
    status: "red",
    sLabel: "Suspended",
    reviews: [
      {
        id: 1,
        patient: "Stanley Hudson",
        rating: 1,
        date: "May 22, 2026",
        comment: "Extremely rude and unprofessional. Will never come back.",
        flagged: true,
      },
      {
        id: 2,
        patient: "Meredith Palmer",
        rating: 2,
        date: "May 15, 2026",
        comment:
          "Did not listen to my symptoms at all. Felt very rushed and dismissed.",
        flagged: true,
      },
      {
        id: 3,
        patient: "Creed Bratton",
        rating: 4,
        date: "Apr 30, 2026",
        comment:
          "Had a decent experience. Doctor was helpful with my prescription.",
        flagged: false,
      },
    ],
  },
];

function StarDisplay({ rating }) {
  return (
    <span className="adm-stars">
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          key={s}
          style={{ color: s <= Math.round(rating) ? "#f59e0b" : "#ddd" }}
        >
          ★
        </span>
      ))}
    </span>
  );
}

function RatingBar({ count, total, index }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  const colors = [
    "var(--adm-red)",
    "var(--adm-amber)",
    "#facc15",
    "#86efac",
    "var(--adm-green)",
  ];
  return (
    <div
      style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}
    >
      <span
        style={{
          fontSize: 11,
          color: "var(--adm-text-muted)",
          width: 12,
          textAlign: "right",
        }}
      >
        {index + 1}
      </span>
      <div className="adm-bar-wrap">
        <div
          className="adm-bar"
          style={{ width: `${pct}%`, background: colors[index] }}
        />
      </div>
      <span
        style={{
          fontSize: 11,
          color: "var(--adm-text-muted)",
          width: 24,
          textAlign: "right",
        }}
      >
        {count}
      </span>
    </div>
  );
}

export default function RatingsPage() {
  const [ratings, setRatings] = useState(RATINGS_DATA);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("All");

  const filtered =
    filter === "All"
      ? ratings
      : filter === "Low"
        ? ratings.filter((r) => r.avgRating < 3.5)
        : filter === "Flagged"
          ? ratings.filter((r) => r.reviews.some((rv) => rv.flagged))
          : ratings;

  function flagReview(doctorId, reviewId) {
    setRatings((prev) =>
      prev.map((d) =>
        d.id === doctorId
          ? {
              ...d,
              reviews: d.reviews.map((r) =>
                r.id === reviewId ? { ...r, flagged: !r.flagged } : r,
              ),
            }
          : d,
      ),
    );
    if (selected?.id === doctorId) {
      setSelected((prev) => ({
        ...prev,
        reviews: prev.reviews.map((r) =>
          r.id === reviewId ? { ...r, flagged: !r.flagged } : r,
        ),
      }));
    }
  }

  function removeReview(doctorId, reviewId) {
    setRatings((prev) =>
      prev.map((d) =>
        d.id === doctorId
          ? {
              ...d,
              reviews: d.reviews.filter((r) => r.id !== reviewId),
              totalReviews: d.totalReviews - 1,
            }
          : d,
      ),
    );
    if (selected?.id === doctorId) {
      setSelected((prev) => ({
        ...prev,
        reviews: prev.reviews.filter((r) => r.id !== reviewId),
        totalReviews: prev.totalReviews - 1,
      }));
    }
  }

  return (
    <div className="adm-shell">
      <AdminSidebar />
      <div className="adm-main">
        <AdminTopbar
          title="Ratings Management"
          searchPlaceholder="Search doctors..."
        />
        <div className="adm-content">
          {/* Header */}
          <div className="adm-page-header">
            <div className="adm-page-header-left">
              <h1>Ratings management</h1>
              <p>
                Monitor doctor ratings, read patient reviews, and flag or remove
                inappropriate content.
              </p>
            </div>
            <div className="adm-header-actions">
              <button className="adm-btn adm-btn-outline">
                <i className="ti ti-download" aria-hidden="true" /> Export
              </button>
            </div>
          </div>

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
              {
                label: "Total reviews",
                num: ratings.reduce((a, d) => a + d.totalReviews, 0),
                color: "var(--adm-text-primary)",
              },
              {
                label: "Avg system rating",
                num: (
                  ratings.reduce((a, d) => a + d.avgRating, 0) / ratings.length
                ).toFixed(1),
                color: "var(--adm-text-primary)",
              },
              {
                label: "Flagged reviews",
                num: ratings.reduce(
                  (a, d) => a + d.reviews.filter((r) => r.flagged).length,
                  0,
                ),
                color: "var(--adm-red)",
              },
              {
                label: "Low rated doctors",
                num: ratings.filter((d) => d.avgRating < 3.5).length,
                color: "var(--adm-amber)",
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

          {/* Filter */}
          <div className="adm-filter-bar">
            {["All", "Low rated", "Flagged"].map((f) => (
              <button
                key={f}
                className={`adm-btn ${filter === f ? "adm-btn-dark" : "adm-btn-outline"}`}
                style={{ padding: "6px 14px", fontSize: 12 }}
                onClick={() => setFilter(f === "Low rated" ? "Low" : f)}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Two-col: table + detail */}
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
                    <th>Doctor</th>
                    <th>Specialty</th>
                    <th>Rating</th>
                    <th>Reviews</th>
                    <th>Flagged</th>
                    <th>Status</th>
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
                      onClick={() =>
                        setSelected((prev) => (prev?.id === d.id ? null : d))
                      }
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
                      <td
                        style={{
                          fontSize: 12,
                          color: "var(--adm-text-secondary)",
                        }}
                      >
                        {d.spec}
                      </td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <StarDisplay rating={d.avgRating} />
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              color: "var(--adm-text-primary)",
                            }}
                          >
                            {d.avgRating}
                          </span>
                        </div>
                      </td>
                      <td style={{ fontSize: 13, fontWeight: 500 }}>
                        {d.totalReviews}
                      </td>
                      <td>
                        {d.reviews.filter((r) => r.flagged).length > 0 ? (
                          <span className="adm-badge adm-badge-red">
                            <i
                              className="ti ti-flag"
                              style={{ fontSize: 10 }}
                            />{" "}
                            {d.reviews.filter((r) => r.flagged).length}
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: 12,
                              color: "var(--adm-text-muted)",
                            }}
                          >
                            —
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={`adm-badge adm-badge-${d.status}`}>
                          {d.sLabel}
                        </span>
                      </td>
                      <td>
                        <button className="adm-icon-btn">
                          <i
                            className="ti ti-chevron-right"
                            aria-hidden="true"
                          />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="adm-table-footer">
                <span>
                  Showing {filtered.length} of {ratings.length} doctors
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
                  <h2 className="adm-card-title">Doctor reviews</h2>
                  <button
                    className="adm-icon-btn"
                    onClick={() => setSelected(null)}
                  >
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
                    <div
                      className="adm-avatar"
                      style={{ width: 44, height: 44, fontSize: 15 }}
                    >
                      {selected.initials}
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: "var(--adm-text-primary)",
                        }}
                      >
                        {selected.name}
                      </div>
                      <div
                        style={{ fontSize: 12, color: "var(--adm-text-muted)" }}
                      >
                        {selected.spec} · {selected.clinic}
                      </div>
                    </div>
                  </div>

                  {/* Big rating */}
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 16 }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 36,
                          fontWeight: 700,
                          color: "var(--adm-text-primary)",
                          lineHeight: 1,
                        }}
                      >
                        {selected.avgRating}
                      </div>
                      <StarDisplay rating={selected.avgRating} />
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--adm-text-muted)",
                          marginTop: 3,
                        }}
                      >
                        {selected.totalReviews} reviews
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      {[...selected.stars].reverse().map((count, i) => (
                        <RatingBar
                          key={i}
                          count={count}
                          total={selected.totalReviews}
                          index={4 - i}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Reviews list */}
                <div style={{ maxHeight: 360, overflowY: "auto" }}>
                  {selected.reviews.map((r) => (
                    <div
                      key={r.id}
                      style={{
                        padding: "14px 18px",
                        borderBottom: "1px solid #f5f5f5",
                        background: r.flagged ? "#fffbeb" : "",
                      }}
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
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 500,
                              color: "var(--adm-text-primary)",
                            }}
                          >
                            {r.patient}
                          </div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              marginTop: 2,
                            }}
                          >
                            <StarDisplay rating={r.rating} />
                            <span
                              style={{
                                fontSize: 11,
                                color: "var(--adm-text-muted)",
                              }}
                            >
                              {r.date}
                            </span>
                          </div>
                        </div>
                        {r.flagged && (
                          <span className="adm-badge adm-badge-amber">
                            <i
                              className="ti ti-flag"
                              style={{ fontSize: 10 }}
                            />{" "}
                            Flagged
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "var(--adm-text-secondary)",
                          lineHeight: 1.6,
                          marginBottom: 10,
                          fontWeight: 300,
                        }}
                      >
                        {r.comment}
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          className={`adm-btn ${r.flagged ? "adm-btn-outline" : "adm-btn-amber"}`}
                          style={{ padding: "4px 10px", fontSize: 11 }}
                          onClick={() => flagReview(selected.id, r.id)}
                        >
                          <i
                            className={`ti ti-flag${r.flagged ? "-off" : ""}`}
                            aria-hidden="true"
                          />
                          {r.flagged ? "Unflag" : "Flag"}
                        </button>
                        <button
                          className="adm-btn adm-btn-red"
                          style={{ padding: "4px 10px", fontSize: 11 }}
                          onClick={() => removeReview(selected.id, r.id)}
                        >
                          <i className="ti ti-trash" aria-hidden="true" />{" "}
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
