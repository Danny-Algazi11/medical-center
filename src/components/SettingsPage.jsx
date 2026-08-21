import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import AdminSidebar from "../admin/AdminSidebar";
import AdminTopbar from "../admin/AdminTopbar";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import { useTranslation } from "../i18n/useTranslation";
import { changePassword } from "../api/auth";
import "./styles/Layout.css";
import "./styles/Settings.css";

// Small mockup swatch so a theme is something you can see, not just read.
function ThemeSwatch({ variant }) {
  if (variant === "system") {
    return (
      <div className="settings-swatch settings-swatch-split" aria-hidden="true">
        <div className="settings-swatch-half settings-swatch-light">
          <div className="settings-swatch-bar" />
          <div className="settings-swatch-lines">
            <span />
            <span />
          </div>
        </div>
        <div className="settings-swatch-half settings-swatch-dark">
          <div className="settings-swatch-bar" />
          <div className="settings-swatch-lines">
            <span />
            <span />
          </div>
        </div>
      </div>
    );
  }
  return (
    <div
      className={`settings-swatch settings-swatch-${variant}`}
      aria-hidden="true"
    >
      <div className="settings-swatch-bar" />
      <div className="settings-swatch-lines">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  const { theme, setTheme, language, setLanguage } = useSettings();
  const { t } = useTranslation();
  const [savedFlash, setSavedFlash] = useState("");

  const [pwForm, setPwForm] = useState({
    current: "",
    next: "",
    confirm: "",
  });
  const [pwError, setPwError] = useState("");
  const [pwSaving, setPwSaving] = useState(false);

  const THEMES = [
    { key: "light", label: t("settings.themeLight"), desc: t("settings.themeLightDesc") },
    { key: "dark", label: t("settings.themeDark"), desc: t("settings.themeDarkDesc") },
    { key: "system", label: t("settings.themeSystem"), desc: t("settings.themeSystemDesc") },
  ];

  const LANGUAGES = [
    {
      key: "en",
      native: "English",
      label: "English",
      sample: "Welcome back — here's what's happening today.",
    },
    {
      key: "ar",
      native: "العربية",
      label: "Arabic",
      sample: "مرحباً بعودتك — إليك آخر التحديثات لهذا اليوم.",
    },
  ];

  function flashSaved(label) {
    setSavedFlash(label);
    window.clearTimeout(flashSaved._t);
    flashSaved._t = window.setTimeout(() => setSavedFlash(""), 1800);
  }

  function handleThemeSelect(key) {
    setTheme(key);
    flashSaved(t("settings.appearanceSaved"));
  }

  function handleLanguageSelect(key) {
    setLanguage(key);
    flashSaved(t("settings.languageSaved"));
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setPwError("");

    if (pwForm.next.length < 8) {
      setPwError(t("settings.passwordTooShort"));
      return;
    }
    if (pwForm.next !== pwForm.confirm) {
      setPwError(t("settings.passwordMismatch"));
      return;
    }

    setPwSaving(true);
    try {
      await changePassword(pwForm.current, pwForm.next, pwForm.confirm);
      setPwForm({ current: "", next: "", confirm: "" });
      flashSaved(t("settings.passwordUpdated"));
    } catch (err) {
      setPwError(
        err.errors
          ? Object.values(err.errors)[0][0]
          : err.message || "Failed to update password.",
      );
    } finally {
      setPwSaving(false);
    }
  }

  const activeLanguage =
    LANGUAGES.find((l) => l.key === language) || LANGUAGES[0];
  const isAdmin = user?.role === "admin";

  const content = (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <h1>{t("settings.title")}</h1>
          <p>{t("settings.subtitle")}</p>
        </div>
        <div
          className={`settings-saved-flash${savedFlash ? " visible" : ""}`}
          role="status"
          aria-live="polite"
        >
          <i className="ti ti-check" aria-hidden="true" />
          {savedFlash}
        </div>
      </div>

      {/* ── Appearance ── */}
      <section className="card settings-section">
        <div className="card-header">
          <h2 className="card-title">{t("settings.appearanceTitle")}</h2>
        </div>
        <div className="settings-section-body">
          <p className="settings-section-desc">{t("settings.appearanceDesc")}</p>
          <div className="settings-option-grid">
            {THEMES.map((th) => (
              <button
                key={th.key}
                type="button"
                className={`settings-option-card${theme === th.key ? " selected" : ""}`}
                onClick={() => handleThemeSelect(th.key)}
                aria-pressed={theme === th.key}
              >
                <ThemeSwatch variant={th.key} />
                <div className="settings-option-text">
                  <div className="settings-option-label">
                    {th.label}
                    {theme === th.key && (
                      <i
                        className="ti ti-circle-check-filled settings-option-check"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                  <div className="settings-option-desc">{th.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Language ── */}
      <section className="card settings-section">
        <div className="card-header">
          <h2 className="card-title">{t("settings.languageTitle")}</h2>
        </div>
        <div className="settings-section-body">
          <p className="settings-section-desc">{t("settings.languageDesc")}</p>
          <div className="settings-option-grid settings-language-grid">
            {LANGUAGES.map((l) => (
              <button
                key={l.key}
                type="button"
                className={`settings-option-card settings-language-card${language === l.key ? " selected" : ""}`}
                onClick={() => handleLanguageSelect(l.key)}
                aria-pressed={language === l.key}
              >
                <div className="settings-language-badge">
                  {l.key.toUpperCase()}
                </div>
                <div className="settings-option-text">
                  <div className="settings-option-label">
                    {l.native}
                    {language === l.key && (
                      <i
                        className="ti ti-circle-check-filled settings-option-check"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                  <div className="settings-option-desc">{l.label}</div>
                </div>
              </button>
            ))}
          </div>

          <div className="settings-preview">
            <div className="settings-preview-label">
              <i className="ti ti-eye" aria-hidden="true" />
              {t("settings.preview")}
            </div>
            <p
              className="settings-preview-text"
              dir={activeLanguage.key === "ar" ? "rtl" : "ltr"}
              lang={activeLanguage.key}
            >
              {activeLanguage.sample}
            </p>
          </div>

          <p className="settings-note">
            <i className="ti ti-info-circle" aria-hidden="true" />
            {t("settings.previewNote")}
          </p>
        </div>
      </section>

      {/* ── Change password ── */}
      <section className="card settings-section">
        <div className="card-header">
          <h2 className="card-title">{t("settings.changePasswordTitle")}</h2>
        </div>
        <div className="settings-section-body">
          <p className="settings-section-desc">{t("settings.changePasswordDesc")}</p>

          <form onSubmit={handleChangePassword}>
            <div className="settings-field">
              <label htmlFor="pw-current">{t("settings.currentPassword")}</label>
              <input
                id="pw-current"
                type="password"
                className="settings-input"
                autoComplete="current-password"
                value={pwForm.current}
                onChange={(e) => setPwForm((f) => ({ ...f, current: e.target.value }))}
                required
              />
            </div>
            <div className="settings-field">
              <label htmlFor="pw-next">{t("settings.newPassword")}</label>
              <input
                id="pw-next"
                type="password"
                className="settings-input"
                autoComplete="new-password"
                minLength={8}
                value={pwForm.next}
                onChange={(e) => setPwForm((f) => ({ ...f, next: e.target.value }))}
                required
              />
            </div>
            <div className="settings-field">
              <label htmlFor="pw-confirm">{t("settings.confirmPassword")}</label>
              <input
                id="pw-confirm"
                type="password"
                className="settings-input"
                autoComplete="new-password"
                minLength={8}
                value={pwForm.confirm}
                onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))}
                required
              />
            </div>

            {pwError && <div className="settings-error-text">{pwError}</div>}

            <button type="submit" className="btn-dark" disabled={pwSaving}>
              {pwSaving ? t("settings.changingPassword") : t("settings.changePasswordButton")}
            </button>
          </form>
        </div>
      </section>
    </>
  );

  if (isAdmin) {
    return (
      <div className="adm-shell">
        <AdminSidebar />
        <div className="adm-main">
          <AdminTopbar title={t("settings.title")} />
          <div className="adm-content settings-content">{content}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="layout-shell">
      <Sidebar />
      <div className="layout-main">
        <Topbar />
        <main className="page-content settings-content">{content}</main>
      </div>
    </div>
  );
}
