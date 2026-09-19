import { useEffect, useMemo, useState, type ReactNode } from "react";
import { I18nContext, type I18nContextValue } from "./context";
import { getLocale, getStoredLanguage, interpolate, LANGUAGE_STORAGE_KEY, translateText } from "./i18n";
import { translations, type Language } from "./translations";

function translateNodeText(value: string, language: Language): string {
  const leadingWhitespace = value.match(/^\s*/)?.[0] ?? "";
  const trailingWhitespace = value.match(/\s*$/)?.[0] ?? "";
  const content = value.trim();

  if (!content) return value;
  return `${leadingWhitespace}${translateText(content, language)}${trailingWhitespace}`;
}

function localizeDocument(language: Language): void {
  const root = document.getElementById("root");
  if (!root) return;

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  let node = walker.nextNode();

  while (node) {
    if (node.parentElement?.closest("[data-i18n-skip]")) {
      node = walker.nextNode();
      continue;
    }
    textNodes.push(node as Text);
    node = walker.nextNode();
  }

  textNodes.forEach((textNode) => {
    const nextValue = translateNodeText(textNode.data, language);
    if (nextValue !== textNode.data) textNode.data = nextValue;
  });

  const attributes = ["aria-label", "title", "placeholder"] as const;
  root.querySelectorAll<HTMLElement>("*").forEach((element) => {
    if (element.closest("[data-i18n-skip]")) return;
    attributes.forEach((attribute) => {
      const value = element.getAttribute(attribute);
      if (!value) return;
      const nextValue = translateText(value, language);
      if (nextValue !== value) element.setAttribute(attribute, nextValue);
    });
  });
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getStoredLanguage);

  useEffect(() => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    document.documentElement.lang = language;
    localizeDocument(language);

    const observer = new MutationObserver(() => localizeDocument(language));
    const root = document.getElementById("root");
    if (root) observer.observe(root, { childList: true, characterData: true, subtree: true });

    return () => observer.disconnect();
  }, [language]);

  const value = useMemo<I18nContextValue>(() => ({
    language,
    locale: getLocale(language),
    setLanguage: setLanguageState,
    t: (key, values) => interpolate(translations[language][key], values),
  }), [language]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
