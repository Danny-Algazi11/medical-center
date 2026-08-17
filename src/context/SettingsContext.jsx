import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

const SettingsContext = createContext(null);

const THEME_KEY = "mc_theme"; // 'light' | 'dark' | 'system'
const LANGUAGE_KEY = "mc_language"; // 'en' | 'ar'

function getSystemTheme() {
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

// Applies the resolved theme/language to <html> so CSS (via [data-theme]
// and [dir]) and the browser's own RTL handling can react to it globally.
function applyToDocument(theme, language) {
  const resolved = theme === "system" ? getSystemTheme() : theme;
  document.documentElement.setAttribute("data-theme", resolved);
  document.documentElement.setAttribute("lang", language);
  document.documentElement.setAttribute(
    "dir",
    language === "ar" ? "rtl" : "ltr",
  );
}

export function SettingsProvider({ children }) {
  const [theme, setThemeState] = useState(
    () => localStorage.getItem(THEME_KEY) || "light",
  );
  const [language, setLanguageState] = useState(
    () => localStorage.getItem(LANGUAGE_KEY) || "en",
  );

  useEffect(() => {
    applyToDocument(theme, language);
  }, [theme, language]);

  // If "system" is selected, keep reacting live if the OS theme changes
  // while the app is open (e.g. macOS auto dark mode at sunset).
  useEffect(() => {
    if (theme !== "system" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyToDocument("system", language);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme, language]);

  const setTheme = useCallback((value) => {
    localStorage.setItem(THEME_KEY, value);
    setThemeState(value);
  }, []);

  const setLanguage = useCallback((value) => {
    localStorage.setItem(LANGUAGE_KEY, value);
    setLanguageState(value);
  }, []);

  return (
    <SettingsContext.Provider
      value={{ theme, setTheme, language, setLanguage }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
