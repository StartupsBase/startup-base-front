"use client"

import * as React from "react"
import { createInstance } from "i18next"
import { I18nextProvider, initReactI18next } from "react-i18next"

import { defaultLanguage, type Language } from "@/i18n/config"
import { defaultNamespace, resources } from "@/i18n/resources"

function I18nProvider({
  children,
  language,
}: {
  children: React.ReactNode
  language: Language
}) {
  const i18n = React.useMemo(() => {
    const instance = createInstance()

    instance.use(initReactI18next).init({
      lng: language,
      fallbackLng: defaultLanguage,
      supportedLngs: Object.keys(resources),
      resources,
      defaultNS: defaultNamespace,
      ns: [defaultNamespace],
      interpolation: {
        escapeValue: false,
      },
      initAsync: false,
    })

    return instance
  }, [language])

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
}

export { I18nProvider }
