import { useSettings } from "../context/SettingsContext";
import { translations } from "./translations";

// t("nav.settings") -> looks up translations[language].nav.settings,
// falling back to English, then to the key itself so a typo shows up as
// visible broken text instead of a blank string.
export function useTranslation() {
  const { language } = useSettings();

  function t(path) {
    const lookup = (dict) =>
      path.split(".").reduce((acc, part) => acc?.[part], dict);

    return lookup(translations[language]) ?? lookup(translations.en) ?? path;
  }

  return { t, language };
}
