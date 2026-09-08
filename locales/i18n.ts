import { I18n } from "i18n-js";
import * as Localization from "expo-localization";

// Importiamo i dizionari JSON
import it from "./it.json";
import en from "./en.json";

// Inizializziamo i18n
const i18n = new I18n({
  it,
  en,
});

// Fallback all'inglese
i18n.enableFallback = true;
i18n.defaultLocale = "it";

// Usiamo la lingua di sistema o una di default
const systemLocales = Localization.getLocales();
if (systemLocales && systemLocales.length > 0) {
  // Prendi il primo locale (es. 'it-IT' diventa 'it')
  const langCode = systemLocales[0].languageCode;
  i18n.locale = langCode === 'it' ? 'it' : 'en';
} else {
  i18n.locale = "it";
}

export default i18n;
