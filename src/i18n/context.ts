import { createContext } from "react";
import type { Language, TranslationKey, TranslationValues } from "./translations";

export type I18nContextValue = {
  language: Language;
  locale: "en-US" | "es-MX";
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey, values?: TranslationValues) => string;
};

export const I18nContext = createContext<I18nContextValue | null>(null);
