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
import { usePathname, useRouter } from "next/navigation";

import { captureUtm, setUserProperties } from "@/lib/analytics";
import { DEFAULT_LOCALE, PREFIXED_LOCALES, type Lang } from "@/lib/locale";
import { mapPathToLocale } from "@/lib/seo";

export type { Lang };

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

function extractLocaleFromPath(pathname: string): Lang {
  const segments = pathname.split("/").filter(Boolean);
  const candidate = (segments[0] ?? "").toLowerCase();
  if ((PREFIXED_LOCALES as ReadonlyArray<string>).includes(candidate)) {
    return candidate as Lang;
  }
  return DEFAULT_LOCALE;
}

export function LanguageProvider({ initialLang = DEFAULT_LOCALE, children }: ProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [lang, setLangState] = useState<Lang>(initialLang);

  useEffect(() => {
    const fromPath = extractLocaleFromPath(pathname || "/");
    setLangState(fromPath);
  }, [pathname]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    captureUtm();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("mt-lang", lang);
    setUserProperties({
      preferred_language: lang,
      device_type:
        typeof navigator !== "undefined" &&
        /mobile|android|iphone|ipad/i.test(navigator.userAgent)
          ? "mobile"
          : "desktop",
    });
  }, [lang]);

  const setLang = useCallback(
    (next: Lang) => {
      if (next === lang) return;
      setLangState(next);
      const target = mapPathToLocale(pathname || "/", next);
      router.push(target);
    },
    [lang, pathname, router]
  );

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

export function normalizeLangValue(value: string | null | undefined): Lang | null {
  return normalize(value);
}
