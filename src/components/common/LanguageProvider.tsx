"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Lang = "ru" | "bg" | "en" | "ua";

const SUPPORTED_LANGS: Lang[] = ["ru", "bg", "en", "ua"];

type LanguageContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

type ProviderProps = {
  initialLang?: Lang;
  children: ReactNode;
};

function normalize(value: string | null | undefined): Lang | null {
  if (!value) return null;
  const short = value.slice(0, 2).toLowerCase();
  return SUPPORTED_LANGS.includes(short as Lang) ? (short as Lang) : null;
}

export function LanguageProvider({ initialLang = "ru", children }: ProviderProps) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const stored = normalize(window.localStorage.getItem("mt-lang"));
    if (stored) {
      setLangState(stored);
      return;
    }

    const fromNavigator = normalize(window.navigator?.language);
    if (fromNavigator) {
      setLangState(fromNavigator);
    }
  }, []);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("mt-lang", next);
    }
  }, []);

  const value = useMemo(() => ({ lang, setLang }), [lang, setLang]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

