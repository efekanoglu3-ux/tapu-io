import { create } from "zustand";
import tr from "../i18n/tr.json";
import en from "../i18n/en.json";

type Lang = "tr" | "en";
type Translations = typeof tr;

interface LangStore {
  lang: Lang;
  t: Translations;
  setLang: (lang: Lang) => void;
}

const translations: Record<Lang, Translations> = { tr, en };

export const useLangStore = create<LangStore>((set) => ({
  lang: "tr",
  t: tr,
  setLang: (lang) => set({ lang, t: translations[lang] }),
}));

// Shorthand hook — use anywhere: const { t, lang, setLang } = useLang();
export function useLang() {
  return useLangStore();
}
