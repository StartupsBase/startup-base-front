import { createInstance, type TFunction, type i18n as I18nInstance } from "i18next"

import { defaultLanguage, type Language } from "./config"
import { defaultNamespace, resources } from "./resources"

export async function createServerI18n(language: Language): Promise<I18nInstance> {
  const i18n = createInstance()

  await i18n.init({
    lng: language,
    fallbackLng: defaultLanguage,
    supportedLngs: Object.keys(resources),
    resources,
    defaultNS: defaultNamespace,
    ns: [defaultNamespace],
    interpolation: {
      escapeValue: false,
    },
  })

  return i18n
}

export async function getTranslation(
  language: Language
): Promise<{ i18n: I18nInstance; t: TFunction<typeof defaultNamespace> }> {
  const i18n = await createServerI18n(language)

  return {
    i18n,
    t: i18n.getFixedT(language, defaultNamespace),
  }
}
