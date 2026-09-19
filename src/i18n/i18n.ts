import { translations, type Language, type TranslationKey, type TranslationValues } from "./translations";

export const LANGUAGE_STORAGE_KEY = "gym-tracker-v1:language";

function isLanguage(value: string | null): value is Language {
  return value === "en" || value === "es";
}

export function getStoredLanguage(): Language {
  if (typeof window === "undefined") return "en";

  const savedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (isLanguage(savedLanguage)) return savedLanguage;

  return window.navigator.language.toLowerCase().startsWith("es") ? "es" : "en";
}

export function getLocale(language = getStoredLanguage()): "en-US" | "es-MX" {
  return language === "es" ? "es-MX" : "en-US";
}

const reverseSpanishTranslations = new Map<string, TranslationKey>(
  Object.entries(translations.es).map(([key, value]) => [value, key as TranslationKey]),
);

function getCanonicalDynamicText(value: string): string {
  return value
    .replace(/^Abrir rutina (.+)$/, "Open routine $1")
    .replace(/^Mover rutina (.+) arriba$/, "Move routine $1 up")
    .replace(/^Mover rutina (.+) abajo$/, "Move routine $1 down")
    .replace(/^Cambiar ejercicio por (.+)$/, "Swap exercise for $1")
    .replace(/^Ver historial de (.+)$/, "View history for $1")
    .replace(/^Ver foto de (.+)$/, "View photo of $1")
    .replace(/^Objetivo: (.+)$/, "Target: $1")
    .replace(/^Descanso (\d+s)$/, "Rest $1")
    .replace(/^Reanudar entrenamiento: (.+)$/, "Resume active workout: $1")
    .replace(/^Más acciones para (.+)$/, "More actions for $1")
    .replace(/^Mover (.+) arriba$/, "Move $1 up")
    .replace(/^Mover (.+) abajo$/, "Move $1 down")
    .replace(/^Siguiente: (.+)$/, "Next: $1")
    .replace(/^Listo para (.+)\.$/, "Ready for $1.");
}

function translateDynamicText(value: string, language: Language): string {
  if (language === "en") return value;

  return value
    .replace(/^Open routine (.+)$/, "Abrir rutina $1")
    .replace(/^Move routine (.+) up$/, "Mover rutina $1 arriba")
    .replace(/^Move routine (.+) down$/, "Mover rutina $1 abajo")
    .replace(/^Swap exercise for (.+)$/, "Cambiar ejercicio por $1")
    .replace(/^View history for (.+)$/, "Ver historial de $1")
    .replace(/^View photo of (.+)$/, "Ver foto de $1")
    .replace(/^Target: (.+)$/, "Objetivo: $1")
    .replace(/^Rest (\d+s)$/, "Descanso $1")
    .replace(/^Resume active workout: (.+)$/, "Reanudar entrenamiento: $1")
    .replace(/^More actions for (.+)$/, "Más acciones para $1")
    .replace(/^Move (.+) up$/, "Mover $1 arriba")
    .replace(/^Move (.+) down$/, "Mover $1 abajo")
    .replace(/^Next: (.+)$/, "Siguiente: $1")
    .replace(/^Ready for (.+)\.$/, "Listo para $1.");
}

export function translateText(value: string, language = getStoredLanguage()): string {
  const canonical = reverseSpanishTranslations.get(value) ?? getCanonicalDynamicText(value);
  const translated = translations[language][canonical as TranslationKey];

  if (translated) return translated;
  return translateDynamicText(canonical, language);
}

export function interpolate(template: string, values?: TranslationValues): string {
  if (!values) return template;

  return template.replace(/{{(\w+)}}/g, (placeholder, name: string) => {
    const value = values[name];
    return value === undefined ? placeholder : String(value);
  });
}
