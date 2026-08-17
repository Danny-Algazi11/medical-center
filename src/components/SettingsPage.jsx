import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { useSettings } from "../context/SettingsContext";
import "./styles/Layout.css";
import "./styles/Settings.css";

const THEMES = [
  { key: "light", label: "Light", desc: "Bright background, dark text." },
  {
    key: "dark",
    label: "Dark",
    desc: "Dark background, easy on the eyes at night.",
  },
  {
    key: "system",
    label: "System",
    desc: "Matches your device's setting automatically.",
  },
];

const LANGUAGES = [
  {
    key: "en",
    label: "English",
    native: "English",
    sample: "Welcome back — here's what's happening today.",
  },
  {
    key: "ar",
    label: "Arabic",
    native: "العربية",
    sample: "مرحباً بعودتك — إليك آخر التحديثات لهذا اليوم.",
  },
];

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
  const { theme, setTheme, language, setLanguage } = useSettings();
  const [savedFlash, setSavedFlash] = useState("");

  function flashSaved(label) {
    setSavedFlash(label);
    window.clearTimeout(flashSaved._t);
    flashSaved._t = window.setTimeout(() => setSavedFlash(""), 1800);
  }

  function handleThemeSelect(key) {
    setTheme(key);
    flashSaved("Appearance updated");
  }

  function handleLanguageSelect(key) {
    setLanguage(key);
    flashSaved("Language updated");
  }

  const activeLanguage =
    LANGUAGES.find((l) => l.key === language) || LANGUAGES[0];

  return (
    <div className="layout-shell">
      <Sidebar />

      <div className="layout-main">
        <Topbar searchPlaceholder="Search settings..." />

        <main className="page-content settings-content">
          <div className="page-header">
            <div className="page-header-left">
              <h1>Settings</h1>
              <p>Manage how MediCenter looks and reads for you.</p>
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
              <h2 className="card-title">Appearance</h2>
            </div>
            <div className="settings-section-body">
              <p className="settings-section-desc">
                Choose how MediCenter looks on this device.
              </p>
              <div className="settings-option-grid">
                {THEMES.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    className={`settings-option-card${theme === t.key ? " selected" : ""}`}
                    onClick={() => handleThemeSelect(t.key)}
                    aria-pressed={theme === t.key}
                  >
                    <ThemeSwatch variant={t.key} />
                    <div className="settings-option-text">
                      <div className="settings-option-label">
                        {t.label}
                        {theme === t.key && (
                          <i
                            className="ti ti-circle-check-filled settings-option-check"
                            aria-hidden="true"
                          />
                        )}
                      </div>
                      <div className="settings-option-desc">{t.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
              <p className="settings-note">
                <i className="ti ti-info-circle" aria-hidden="true" />
                Dark mode currently applies to the sidebar, top bar, and page
                background. Individual pages will pick up full dark styling in a
                later update.
              </p>
            </div>
          </section>

          {/* ── Language ── */}
          <section className="card settings-section">
            <div className="card-header">
              <h2 className="card-title">Language &amp; region</h2>
            </div>
            <div className="settings-section-body">
              <p className="settings-section-desc">
                Choose the language you'd like to read MediCenter in.
              </p>
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
                  Preview
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
                This preview shows how text will read — the rest of the app's
                screens will be translated in a later update.
              </p>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
