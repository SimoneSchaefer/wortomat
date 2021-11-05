import { Locales } from "./locales";

import en from "./en.json";
import de from "./de.json";

export const messages = {
  [Locales.EN]: en,
  [Locales.DE]: de,
};

export const defaultLocale = Locales.EN;