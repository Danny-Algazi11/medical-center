import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  registerDoctor,
  completeDoctorProfile,
  verifyEmailCode,
  resendCode,
} from "../api/auth";
import "./styles/SignupPage.css";

/* ── Departments with IDs sent to API ──────────────────── */
const DEPARTMENTS = [
  { id: 1, name: "Cardiology" },
  { id: 2, name: "Pediatrics" },
  { id: 3, name: "General Medicine" },
  { id: 4, name: "Dermatology" },
  { id: 5, name: "Neurology" },
  { id: 6, name: "Psychiatry" },
  { id: 7, name: "Gynecology" },
  { id: 8, name: "ENT" },
  { id: 9, name: "Ophthalmology" },
  { id: 10, name: "Dentistry" },
  { id: 11, name: "General Surgery" },
  { id: 12, name: "Orthopedics" },
  { id: 13, name: "General Medicine" }, // duplicate name in the seeder itself — not a typo here
  { id: 14, name: "Internal Medicine" },
];

const STEPS = ["Basic info", "Verify email", "Complete profile"];

/* ── Progress bar ──────────────────────────────────────── */
function ProgressBar({ step }) {
  return (
    <div className="signup-progress">
      {STEPS.map((label, i) => (
        <div className="signup-step-item" key={label}>
          <div
            className={`signup-step-circle${step === i ? " active" : step > i ? " done" : ""}`}
          >
            {step > i ? (
              <i
                className="ti ti-check"
                style={{ fontSize: 13 }}
                aria-hidden="true"
              />
            ) : (
              i + 1
            )}
          </div>
          <span
            className={`signup-step-label${step === i ? " active" : step > i ? " done" : ""}`}
          >
            {label}
          </span>
          {i < STEPS.length - 1 && (
            <div className={`signup-step-line${step > i ? " done" : ""}`} />
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Upload field ──────────────────────────────────────── */
function UploadField({ label, hint, multiple = false, onChange, files = [] }) {
  return (
    <div className="signup-field">
      <label className="signup-label">{label}</label>
      <div className="signup-upload">
        <input
          type="file"
          multiple={multiple}
          onChange={(e) => onChange(Array.from(e.target.files))}
          accept="image/*,.pdf"
        />
        <div className="signup-upload-icon">
          <i className="ti ti-cloud-upload" aria-hidden="true" />
        </div>
        <div className="signup-upload-label">
          Click to upload or drag & drop
        </div>
        <div className="signup-upload-sub">{hint}</div>
        {files.length > 0 && (
          <div className="signup-upload-files">
            {files.map((f, i) => (
              <span key={i} className="signup-file-chip">
                <i className="ti ti-file" aria-hidden="true" />
                {f.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── OTP input ─────────────────────────────────────────── */
function OTPInput({ value, onChange }) {
  const inputs = useRef([]);
  const digits = value.split("");

  function handleKey(i, e) {
    if (e.key === "Backspace") {
      const next = [...digits];
      next[i] = "";
      onChange(next.join(""));
      if (i > 0) inputs.current[i - 1]?.focus();
    }
  }

  function handleChange(i, e) {
    const val = e.target.value.replace(/\D/, "").slice(-1);
    const next = [...digits];
    next[i] = val;
    onChange(next.join(""));
    if (val && i < 5) inputs.current[i + 1]?.focus();
  }

  function handlePaste(e) {
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    onChange(pasted.padEnd(6, "").slice(0, 6));
    inputs.current[Math.min(pasted.length, 5)]?.focus();
    e.preventDefault();
  }

  return (
    <div className="signup-otp-wrap">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <input
          key={i}
          ref={(el) => (inputs.current[i] = el)}
          className="signup-otp-input"
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[i] || ""}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKey(i, e)}
          onPaste={handlePaste}
        />
      ))}
    </div>
  );
}

/* ── Main component ────────────────────────────────────── */
export default function SignupPage() {
  const navigate = useNavigate();

  // ── State ──
  const [role, setRole] = useState(""); // 'doctor' | 'reception'
  const [step, setStep] = useState(-1); // -1 = role select, 0/1/2 = steps
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Step 0 — basic info
  const [basic, setBasic] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    idCardNumber: "",
    clinicCode: "",
  });

  // Step 1 — OTP
  const [otp, setOtp] = useState("");
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const timerRef = useRef(null);

  // Step 2 — complete profile shared
  const [profile, setProfile] = useState({
    phone: "",
    gender: "",
    dob: "",
    address: "",
    departmentIds: [],
    practiceStartDate: "",
    consultationFee: "",
    registrationMode: "",
    clinicCode: "",
    clinicName: "",
    clinicAddress: "",
    clinicPhone: "",
  });

  // Step 2 — uploads
  const [uploads, setUploads] = useState({
    license: [],
    certificates: [],
    idPhoto: [],
    personalPhoto: [],
    clinicLicense: [],
  });

  // Doctor path
  const [doctorPath, setDoctorPath] = useState(""); // 'create' | 'join'

  // ── Countdown ──
  useEffect(() => {
    if (step === 1) startCountdown();
    return () => clearInterval(timerRef.current);
  }, [step]);

  function startCountdown() {
    setCountdown(60);
    setCanResend(false);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  async function handleResend() {
    try {
      await resendCode();
      startCountdown();
    } catch (err) {
      setError("Could not resend code. Try again later.");
    }
  }

  // ── Handlers ──
  function handleBasicChange(e) {
    setBasic((p) => ({ ...p, [e.target.name]: e.target.value }));
    setError("");
  }

  function handleProfileChange(e) {
    const { name, value } = e.target;

    // Special case for department
    if (name === "departmentIds") {
      setProfile((p) => ({
        ...p,
        departmentIds: [value], // array required by backend
      }));
      setError("");
      return;
    }

    // Normal fields
    setProfile((p) => ({ ...p, [name]: value }));
    setError("");
  }

  function setUpload(key, files) {
    setUploads((p) => ({ ...p, [key]: files }));
  }

  // ── Validation ──
  function validateBasic() {
    if (
      !basic.firstName ||
      !basic.lastName ||
      !basic.email ||
      !basic.password ||
      !basic.confirmPassword ||
      !basic.idCardNumber
    ) {
      setError("Please fill in all required fields.");
      return false;
    }
    if (basic.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return false;
    }
    if (basic.password !== basic.confirmPassword) {
      setError("Passwords do not match.");
      return false;
    }
    if (role === "reception" && !basic.clinicCode) {
      setError("Please enter your clinic code.");
      return false;
    }
    if (role === "reception" && basic.clinicCode.length !== 10) {
      setError("Clinic code must be exactly 10 characters.");
      return false;
    }
    return true;
  }

  function validateOtp() {
    if (otp.length < 6) {
      setError("Please enter the 6-digit code.");
      return false;
    }
    return true;
  }

  function validateProfile() {
    if (!profile.phone || !profile.gender || !profile.dob || !profile.address) {
      setError("Please fill in all required fields.");
      return false;
    }
    if (role === "doctor") {
      if (!profile.practiceStartDate) {
        setError("Please enter your practice start date.");
        return false;
      }
      if (!profile.departmentIds || profile.departmentIds.length === 0) {
        setError("Please select a department.");
        return false;
      }
      if (!doctorPath) {
        setError("Please choose to create or join a clinic.");
        return false;
      }
      if (doctorPath === "create") {
        if (
          !profile.clinicName ||
          !profile.clinicAddress ||
          !profile.clinicPhone
        ) {
          setError("Please fill in all clinic details.");
          return false;
        }
      }
      if (doctorPath === "join" && !profile.clinicCode) {
        setError("Please enter the clinic code.");
        return false;
      }
      if (doctorPath === "join" && profile.clinicCode.length !== 10) {
        setError("Clinic code must be exactly 10 characters.");
        return false;
      }
      if (!profile.consultationFee) {
        setError("Please enter your consultation fee.");
        return false;
      }
    }
    return true;
  }

  // ── Submit handlers ──
  async function handleBasicSubmit(e) {
    e.preventDefault();
    if (!validateBasic()) return;
    setLoading(true);

    try {
      const result = await registerDoctor(basic, role);
      console.log("REGISTER RESPONSE:", result);
      setStep(1);
      setError("");
    } catch (err) {
      console.log("REGISTER ERROR:", err.response?.data);
      console.error("Registration error:", err);
      setError(err.response?.data?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleOtpSubmit(e) {
    e.preventDefault();
    if (!validateOtp()) return;
    setLoading(true);

    try {
      await verifyEmailCode(otp);
      setStep(2); // move to complete profile
      setError("");
    } catch (err) {
      setError(
        err.response?.data?.message || "Invalid code. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleProfileSubmit(e) {
    e.preventDefault();
    if (!validateProfile()) return;
    setLoading(true);

    try {
      await completeDoctorProfile(profile, uploads, doctorPath, role);

      if (role === "doctor") {
        navigate("/doctor-pending", { replace: true });
        return;
      }

      navigate("/reception-pending", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Profile completion failed.");
    } finally {
      setLoading(false);
    }
  }

  // ── Left panel content changes by step ──
  const heroContent = {
    "-1": {
      h: (
        <>
          Create your
          <br />
          <em>account.</em>
        </>
      ),
      p: "Join MediCenter as a doctor or receptionist. Your portal access starts here.",
    },
    0: {
      h: (
        <>
          Basic
          <br />
          <em>information.</em>
        </>
      ),
      p: "Fill in your personal details to get started. You'll verify your email next.",
    },
    1: {
      h: (
        <>
          Verify your
          <br />
          <em>email.</em>
        </>
      ),
      p: "We sent a 6-digit code to your email. Enter it below to confirm your identity.",
    },
    2: {
      h: (
        <>
          Complete your
          <br />
          <em>profile.</em>
        </>
      ),
      p: "Almost there — add your professional details to finish setting up your account.",
    },
  };
  const hero = heroContent[String(step)];

  return (
    <div className="signup-root">
      {/* ── Left panel ── */}
      <aside className="signup-left" aria-hidden="true">
        <div className="signup-logo">
          <div className="signup-logo-icon">
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              <path d="M12 5 9.04 7.96a2.17 2.17 0 0 0 0 3.08v0c.82.82 2.13.85 3 .07l2.07-1.9a2.82 2.82 0 0 1 3.79 0l2.96 2.66" />
              <path d="m18 15-2-2" />
              <path d="m15 18-2-2" />
            </svg>
          </div>
          <div>
            <div className="signup-logo-name">MediCenter</div>
            <div className="signup-logo-sub">Health Portal</div>
          </div>
        </div>

        <div className="signup-left-hero">
          <h2>{hero.h}</h2>
          <p>{hero.p}</p>
          <div className="signup-features">
            {[
              "Secure & HIPAA compliant",
              "Role-based access control",
              "Connected to all clinic branches",
              "Full patient management tools",
            ].map((f) => (
              <div className="signup-feature" key={f}>
                <div className="signup-feature-dot" />
                {f}
              </div>
            ))}
          </div>
        </div>

        <p className="signup-tagline">
          © {new Date().getFullYear()} MediCenter. All rights reserved.
        </p>
      </aside>

      {/* ── Right panel ── */}
      <main className="signup-right">
        {/* ══════════════════════════════════════════════ */}
        {/* STEP -1 — Role selection                      */}
        {/* ══════════════════════════════════════════════ */}
        {step === -1 && (
          <>
            <h1 className="signup-section-title">Who are you?</h1>
            <p className="signup-section-sub">
              Select your role to get started. This determines your access level
              and registration flow.
            </p>

            <div className="signup-role-grid">
              {[
                {
                  key: "doctor",
                  icon: "ti-stethoscope",
                  name: "Doctor",
                  desc: "Register as a licensed medical professional. You can create or join a clinic.",
                },
                {
                  key: "reception",
                  icon: "ti-headset",
                  name: "Receptionist",
                  desc: "Register as reception staff. You will be linked to an existing clinic by ID.",
                },
              ].map((r) => (
                <button
                  key={r.key}
                  className={`signup-role-card${role === r.key ? " selected" : ""}`}
                  onClick={() => setRole(r.key)}
                >
                  <div className="signup-role-icon">
                    <i className={`ti ${r.icon}`} aria-hidden="true" />
                  </div>
                  <div className="signup-role-name">{r.name}</div>
                  <div className="signup-role-desc">{r.desc}</div>
                </button>
              ))}
            </div>

            <button
              className="signup-btn"
              disabled={!role}
              onClick={() => setStep(0)}
            >
              Continue as{" "}
              {role ? (role === "doctor" ? "Doctor" : "Receptionist") : "..."} →
            </button>

            <p className="signup-switch">
              Already have an account? <Link to="/login">Sign in →</Link>
            </p>
          </>
        )}

        {/* ══════════════════════════════════════════════ */}
        {/* STEPS 0–2 — show progress bar                 */}
        {/* ══════════════════════════════════════════════ */}
        {step >= 0 && <ProgressBar step={step} />}

        {/* ══════════════════════════════════════════════ */}
        {/* STEP 0 — Basic info                           */}
        {/* ══════════════════════════════════════════════ */}
        {step === 0 && (
          <>
            <h1 className="signup-section-title">Basic information</h1>
            <p className="signup-section-sub">
              {role === "doctor"
                ? "Fill in your personal and account details."
                : "Fill in your details and your clinic ID to get started."}
            </p>

            {error && (
              <div className="signup-error" role="alert">
                {error}
              </div>
            )}

            <form
              className="signup-form"
              onSubmit={handleBasicSubmit}
              noValidate
            >
              <div className="signup-form-row">
                <div className="signup-field">
                  <label className="signup-label" htmlFor="firstName">
                    First name
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    className="signup-input"
                    placeholder="Ahmad"
                    value={basic.firstName}
                    onChange={handleBasicChange}
                    required
                  />
                </div>
                <div className="signup-field">
                  <label className="signup-label" htmlFor="lastName">
                    Last name
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    className="signup-input"
                    placeholder="Karimi"
                    value={basic.lastName}
                    onChange={handleBasicChange}
                    required
                  />
                </div>
              </div>

              <div className="signup-field">
                <label className="signup-label" htmlFor="email">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="signup-input"
                  placeholder="you@example.com"
                  value={basic.email}
                  onChange={handleBasicChange}
                  required
                />
              </div>

              <div className="signup-form-row">
                <div className="signup-field">
                  <label className="signup-label" htmlFor="password">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    className="signup-input"
                    placeholder="Min. 8 characters"
                    value={basic.password}
                    onChange={handleBasicChange}
                    required
                  />
                </div>
                <div className="signup-field">
                  <label className="signup-label" htmlFor="confirmPassword">
                    Confirm password
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    className="signup-input"
                    placeholder="Repeat password"
                    value={basic.confirmPassword}
                    onChange={handleBasicChange}
                    required
                  />
                </div>
              </div>

              <div className="signup-field">
                <label className="signup-label" htmlFor="idCardNumber">
                  ID card number
                </label>
                <input
                  id="idCardNumber"
                  name="idCardNumber"
                  inputMode="numeric"
                  className="signup-input"
                  placeholder="e.g. 1234567890"
                  value={basic.idCardNumber}
                  onChange={(e) =>
                    setBasic((p) => ({
                      ...p,
                      // Backend stores this as a SQL integer column, so
                      // letters/dashes/spaces would fail at the DB layer.
                      idCardNumber: e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 10),
                    }))
                  }
                  required
                />
              </div>

              {role === "reception" && (
                <div className="signup-field">
                  <label className="signup-label" htmlFor="clinicCode">
                    Clinic code
                  </label>
                  <input
                    id="clinicCode"
                    name="clinicCode"
                    className="signup-input"
                    placeholder="10-character clinic code"
                    maxLength={10}
                    value={basic.clinicCode}
                    onChange={(e) =>
                      setBasic((p) => ({
                        ...p,
                        clinicCode: e.target.value.slice(0, 10),
                      }))
                    }
                    required
                  />
                </div>
              )}

              <div className="signup-btn-row">
                <button
                  type="button"
                  className="signup-btn-outline"
                  onClick={() => setStep(-1)}
                >
                  ← Back
                </button>
                <button type="submit" className="signup-btn" disabled={loading}>
                  {loading ? "Sending code…" : "Continue →"}
                </button>
              </div>
            </form>

            <p className="signup-switch">
              Already have an account? <Link to="/login">Sign in →</Link>
            </p>
          </>
        )}

        {/* ══════════════════════════════════════════════ */}
        {/* STEP 1 — Email verification                   */}
        {/* ══════════════════════════════════════════════ */}
        {step === 1 && (
          <>
            <h1 className="signup-section-title">Verify your email</h1>
            <p className="signup-section-sub">
              We sent a 6-digit code to <strong>{basic.email}</strong>. Enter it
              below to continue.
            </p>

            {error && (
              <div className="signup-error" role="alert">
                {error}
              </div>
            )}

            <form className="signup-form" onSubmit={handleOtpSubmit} noValidate>
              <OTPInput value={otp} onChange={setOtp} />

              <div className="signup-resend">
                {canResend ? (
                  <>
                    Didn't receive it?{" "}
                    <button type="button" onClick={handleResend}>
                      Resend code
                    </button>
                  </>
                ) : (
                  <>
                    Resend code in <strong>{countdown}s</strong>
                  </>
                )}
              </div>

              <div className="signup-btn-row">
                <button
                  type="button"
                  className="signup-btn-outline"
                  onClick={() => setStep(0)}
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  className="signup-btn"
                  disabled={loading || otp.length < 6}
                >
                  {loading ? "Verifying…" : "Verify & continue →"}
                </button>
              </div>
            </form>
          </>
        )}

        {/* ══════════════════════════════════════════════ */}
        {/* STEP 2 — Complete profile                     */}
        {/* ══════════════════════════════════════════════ */}
        {step === 2 && (
          <>
            <h1 className="signup-section-title">Complete your profile</h1>
            <p className="signup-section-sub">
              {role === "doctor"
                ? "Add your professional details and documents."
                : "Add your personal details to finish."}
            </p>

            {error && (
              <div className="signup-error" role="alert">
                {error}
              </div>
            )}

            <form
              className="signup-form"
              onSubmit={handleProfileSubmit}
              noValidate
            >
              {/* ── Shared fields ── */}
              <div className="signup-field">
                <label className="signup-label" htmlFor="phone">
                  Phone number
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  className="signup-input"
                  placeholder="+1 555-000-0000"
                  value={profile.phone}
                  onChange={handleProfileChange}
                  required
                />
              </div>

              <div className="signup-form-row">
                <div className="signup-field">
                  <label className="signup-label" htmlFor="gender">
                    Gender
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    className="signup-select"
                    value={profile.gender}
                    onChange={handleProfileChange}
                    required
                  >
                    <option value="">Select gender</option>
                    <option>male</option>
                    <option>female</option>
                  </select>
                </div>
                <div className="signup-field">
                  <label className="signup-label" htmlFor="dob">
                    Date of birth
                  </label>
                  <input
                    id="dob"
                    name="dob"
                    type="date"
                    className="signup-input"
                    value={profile.dob}
                    onChange={handleProfileChange}
                    required
                  />
                </div>
              </div>
              {role === "doctor" && (
                <div className="signup-field">
                  <label className="signup-label" htmlFor="practiceStartDate">
                    Practice start date
                  </label>
                  <input
                    id="practiceStartDate"
                    name="practiceStartDate"
                    type="date"
                    className="signup-input"
                    value={profile.practiceStartDate}
                    onChange={handleProfileChange}
                    max={new Date().toISOString().split("T")[0]}
                    required
                  />
                </div>
              )}

              {role === "doctor" && (
                <div className="signup-field">
                  <label className="signup-label" htmlFor="consultationFee">
                    Consultation fee
                  </label>
                  <input
                    id="consultationFee"
                    name="consultationFee"
                    type="number"
                    min="0"
                    max="99999999.99"
                    step="0.01"
                    className="signup-input"
                    placeholder="e.g. 50.00"
                    value={profile.consultationFee}
                    onChange={handleProfileChange}
                    required
                  />
                </div>
              )}

              <div className="signup-field">
                <label className="signup-label" htmlFor="address">
                  Address
                </label>
                <input
                  id="address"
                  name="address"
                  className="signup-input"
                  placeholder="123 Main Street, City"
                  value={profile.address}
                  onChange={handleProfileChange}
                  required
                />
              </div>

              {/* ── Doctor-only fields ── */}
              {role === "doctor" && (
                <>
                  <div className="signup-field">
                    <label className="signup-label" htmlFor="departmentId">
                      Department
                    </label>
                    <select
                      id="departmentIds"
                      name="departmentIds"
                      className="signup-select"
                      value={profile.departmentIds[0] || ""}
                      onChange={handleProfileChange}
                      required
                    >
                      <option value="">Select department</option>
                      {DEPARTMENTS.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Doctor path */}
                  <div className="signup-field">
                    <label className="signup-label">Clinic registration</label>
                    <div className="signup-path-toggle">
                      <button
                        type="button"
                        className={`signup-path-btn${doctorPath === "create" ? " selected" : ""}`}
                        onClick={() => {
                          setDoctorPath("create");
                          setProfile((p) => ({
                            ...p,
                            registrationMode: "create_clinic",
                          }));
                        }}
                      >
                        <div className="signup-path-title">Create a clinic</div>
                        <div className="signup-path-sub">
                          Register your own clinic and become the primary doctor
                        </div>
                      </button>
                      <button
                        type="button"
                        className={`signup-path-btn${doctorPath === "join" ? " selected" : ""}`}
                        onClick={() => {
                          setDoctorPath("join");
                          setProfile((p) => ({
                            ...p,
                            registrationMode: "join_clinic",
                          }));
                        }}
                      >
                        <div className="signup-path-title">Join a clinic</div>
                        <div className="signup-path-sub">
                          Enter an existing clinic ID to join as a staff doctor
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Create clinic fields */}
                  {doctorPath === "create" && (
                    <>
                      <div className="signup-divider">
                        <div className="signup-divider-line" />
                        <span>Clinic details</span>
                        <div className="signup-divider-line" />
                      </div>
                      <div className="signup-field">
                        <label className="signup-label" htmlFor="clinicName">
                          Clinic name
                        </label>
                        <input
                          id="clinicName"
                          name="clinicName"
                          className="signup-input"
                          placeholder="My Medical Clinic"
                          value={profile.clinicName}
                          onChange={handleProfileChange}
                          required
                        />
                      </div>
                      <div className="signup-field">
                        <label className="signup-label" htmlFor="clinicAddress">
                          Clinic address
                        </label>
                        <input
                          id="clinicAddress"
                          name="clinicAddress"
                          className="signup-input"
                          placeholder="456 Clinic Ave, City"
                          value={profile.clinicAddress}
                          onChange={handleProfileChange}
                          required
                        />
                      </div>
                      <div className="signup-field">
                        <label className="signup-label" htmlFor="clinicPhone">
                          Clinic phone
                        </label>
                        <input
                          id="clinicPhone"
                          name="clinicPhone"
                          type="tel"
                          className="signup-input"
                          placeholder="+1 555-111-2222"
                          value={profile.clinicPhone}
                          onChange={handleProfileChange}
                          required
                        />
                      </div>
                    </>
                  )}

                  {/* Join clinic fields */}
                  {doctorPath === "join" && (
                    <div className="signup-field">
                      <label className="signup-label" htmlFor="joinClinicCode">
                        Clinic code
                      </label>
                      <input
                        id="joinClinicCode"
                        name="clinicCode"
                        className="signup-input"
                        placeholder="10-character clinic code"
                        maxLength={10}
                        value={profile.clinicCode}
                        onChange={(e) =>
                          setProfile((p) => ({
                            ...p,
                            clinicCode: e.target.value.slice(0, 10),
                          }))
                        }
                        required
                      />
                    </div>
                  )}

                  {/* Document uploads */}
                  {doctorPath && (
                    <>
                      <div className="signup-divider">
                        <div className="signup-divider-line" />
                        <span>Documents & photos</span>
                        <div className="signup-divider-line" />
                      </div>

                      <UploadField
                        label="Doctor license"
                        hint="PDF or image · Max 5MB"
                        files={uploads.license}
                        onChange={(f) => setUpload("license", f)}
                      />

                      <UploadField
                        label="Certificates"
                        hint="You can upload multiple files · PDF or image"
                        multiple
                        files={uploads.certificates}
                        onChange={(f) => setUpload("certificates", f)}
                      />

                      <div className="signup-form-row">
                        <UploadField
                          label="ID card photo"
                          hint="Image · Max 5MB"
                          files={uploads.idPhoto}
                          onChange={(f) => setUpload("idPhoto", f)}
                        />
                        <UploadField
                          label="Personal photo"
                          hint="Image · Max 5MB"
                          files={uploads.personalPhoto}
                          onChange={(f) => setUpload("personalPhoto", f)}
                        />
                      </div>

                      {doctorPath === "create" && (
                        <UploadField
                          label="Clinic license"
                          hint="PDF or image · Max 5MB"
                          files={uploads.clinicLicense}
                          onChange={(f) => setUpload("clinicLicense", f)}
                        />
                      )}
                    </>
                  )}
                </>
              )}

              <div className="signup-btn-row">
                <button
                  type="button"
                  className="signup-btn-outline"
                  onClick={() => setStep(1)}
                >
                  ← Back
                </button>
                <button type="submit" className="signup-btn" disabled={loading}>
                  {loading ? "Submitting…" : "Create account →"}
                </button>
              </div>
            </form>

            <p className="signup-switch">
              Already have an account? <Link to="/login">Sign in →</Link>
            </p>
          </>
        )}
      </main>
    </div>
  );
}
