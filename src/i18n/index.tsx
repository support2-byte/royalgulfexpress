import * as SecureStore from "expo-secure-store";
import moment from "moment";
import "moment/locale/ar";
import "moment/locale/ur";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ar } from "./locales/ar";
import { ur } from "./locales/ur";

export type Lang = "en" | "ur" | "ar";

export const LANGUAGES: { code: Lang; native: string; english: string }[] = [
  { code: "en", native: "English", english: "English" },
  { code: "ur", native: "اردو", english: "Urdu" },
  { code: "ar", native: "العربية", english: "Arabic" },
];

const STORE_KEY = "app_language";

// Importing moment locale files switches the global locale, and the Arabic
// locale renders Arabic-Indic digits. The rest of the app uses Latin digits,
// so keep them consistent and reset the global locale.
moment.updateLocale("ar", { preparse: (s: string) => s, postformat: (s: string) => s });
moment.locale("en");

const dictionaries: Record<Lang, Record<string, string>> = { en: {}, ar, ur };

// Module level so non-React code (contexts, toasts, helpers) can translate.
// Components re-render on change because useAppTheme() subscribes to the
// language context.
let current: Lang = "en";

export const getLang = () => current;
export const isRtlLang = (lang: Lang = current) => lang !== "en";

/** Translate an English source string. Unknown strings fall back to English. */
export const tr = (key: string, vars?: Record<string, string | number>) => {
  let out = dictionaries[current][key] ?? key;
  if (vars) {
    out = out.replace(/\{(\w+)\}/g, (_, k) =>
      vars[k] !== undefined ? String(vars[k]) : `{${k}}`,
    );
  }
  return out;
};

/** Negative letter-spacing breaks Arabic-script letter joining. */
export const ls = (value: number) => (isRtlLang() ? 0 : value);

/** Mirror directional icons (chevrons / arrows) for RTL languages. */
export const flipIcon = (name: string) => {
  if (!isRtlLang()) return name;
  if (name.endsWith("forward")) return name.replace("forward", "back");
  if (name.endsWith("back")) return name.replace("back", "forward");
  return name;
};

interface I18nContextType {
  lang: Lang;
  isRTL: boolean;
  setLang: (lang: Lang) => void;
  t: typeof tr;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const isLang = (v: string | null): v is Lang =>
  v === "en" || v === "ur" || v === "ar";

const apply = (lang: Lang) => {
  current = lang;
  moment.locale(lang);
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Lang>("en");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const saved = await SecureStore.getItemAsync(STORE_KEY);
        if (isLang(saved)) {
          apply(saved);
          setLangState(saved);
        }
      } catch {
        // fall back to English
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const setLang = useCallback((next: Lang) => {
    apply(next);
    setLangState(next);
    SecureStore.setItemAsync(STORE_KEY, next).catch(() => {});
  }, []);

  const value = useMemo<I18nContextType>(
    () => ({ lang, isRTL: isRtlLang(lang), setLang, t: tr }),
    [lang, setLang],
  );

  if (!ready) return null;

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = (): I18nContextType => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within a LanguageProvider");
  return ctx;
};
