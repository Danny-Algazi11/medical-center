// Audit log entries come back as raw action strings like "doctor_verified",
// "clinic_suspended", "auth.login", "report_resolved" — there's no label,
// severity, or icon in the API response, so we derive them here from
// keywords instead of hardcoding every action the backend might ever log.

export function formatAuditAction(action) {
  if (!action) return "Unknown action";
  return action
    .replace(/^auth\./, "")
    .split(/[._]/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

// entity_type is a fully-qualified PHP class name, e.g. "App\\Models\\Doctor"
export function formatEntityType(entityType) {
  if (!entityType) return "—";
  const parts = entityType.split("\\");
  return parts[parts.length - 1];
}

const NEGATIVE = ["suspend", "reject", "dismiss", "delete", "deactivat"];
const POSITIVE = [
  "verif",
  "approv",
  "reactivat",
  "resolv",
  "creat",
  "activat",
  "action_taken",
];
const CAUTION = ["under_review", "pending", "review"];
const INFO = ["login", "logout", "register", "password", "email"];

export function auditSeverity(action) {
  const a = (action || "").toLowerCase();
  if (NEGATIVE.some((k) => a.includes(k))) return "red";
  if (CAUTION.some((k) => a.includes(k))) return "amber";
  if (INFO.some((k) => a.includes(k))) return "blue";
  if (POSITIVE.some((k) => a.includes(k))) return "green";
  return "gray";
}

export const SEVERITY_ICON = {
  red: "ti-alert-triangle",
  green: "ti-circle-check",
  amber: "ti-flag",
  blue: "ti-info-circle",
  gray: "ti-minus",
};

export const SEVERITY_BADGE = {
  red: "adm-badge-red",
  green: "adm-badge-green",
  amber: "adm-badge-amber",
  blue: "adm-badge-blue",
  gray: "adm-badge-gray",
};

export function formatTimestamp(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
