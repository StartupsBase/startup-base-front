import type { Language } from "./config"

export const defaultNamespace = "common"

export const resources = {
  ru: {
    common: {
      home: {
        title: "Проект готов!",
        intro: "Теперь можно добавлять компоненты и начинать разработку.",
        buttonReady: "Кнопка уже подключена.",
        action: "Кнопка",
        themeHint: "Нажмите d, чтобы переключить темную тему.",
        languageLabel: "Язык",
      },
    },
  },
  uz: {
    common: {
      home: {
        title: "Loyiha tayyor!",
        intro: "Endi komponentlar qo'shib, ishlab chiqishni boshlashingiz mumkin.",
        buttonReady: "Tugma komponenti allaqachon ulangan.",
        action: "Tugma",
        themeHint: "Qorong'i mavzuni almashtirish uchun d tugmasini bosing.",
        languageLabel: "Til",
      },
    },
  },
} satisfies Record<Language, Record<typeof defaultNamespace, object>>
