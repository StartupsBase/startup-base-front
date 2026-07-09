import type { Language } from "./config"

export const defaultNamespace = "common"

export const resources = {
  ru: {
    common: {
      home: {
        title: "\u041f\u0440\u043e\u0435\u043a\u0442 \u0433\u043e\u0442\u043e\u0432!",
        intro:
          "\u0422\u0435\u043f\u0435\u0440\u044c \u043c\u043e\u0436\u043d\u043e \u0434\u043e\u0431\u0430\u0432\u043b\u044f\u0442\u044c \u043a\u043e\u043c\u043f\u043e\u043d\u0435\u043d\u0442\u044b \u0438 \u043d\u0430\u0447\u0438\u043d\u0430\u0442\u044c \u0440\u0430\u0437\u0440\u0430\u0431\u043e\u0442\u043a\u0443.",
        buttonReady:
          "\u041a\u043d\u043e\u043f\u043a\u0430 \u0443\u0436\u0435 \u043f\u043e\u0434\u043a\u043b\u044e\u0447\u0435\u043d\u0430.",
        action: "\u041a\u043d\u043e\u043f\u043a\u0430",
        themeHint:
          "\u041d\u0430\u0436\u043c\u0438\u0442\u0435 d, \u0447\u0442\u043e\u0431\u044b \u043f\u0435\u0440\u0435\u043a\u043b\u044e\u0447\u0438\u0442\u044c \u0442\u0435\u043c\u043d\u0443\u044e \u0442\u0435\u043c\u0443.",
        languageLabel: "\u042f\u0437\u044b\u043a",
      },
      login: {
        brand: "Humayro",
        title: "\u0412\u043e\u0439\u0442\u0438 \u0432 \u0430\u043a\u043a\u0430\u0443\u043d\u0442",
        subtitle:
          "\u0418\u0441\u043f\u043e\u043b\u044c\u0437\u0443\u0439\u0442\u0435 email \u0438\u043b\u0438 \u043d\u043e\u043c\u0435\u0440 \u0442\u0435\u043b\u0435\u0444\u043e\u043d\u0430, \u0447\u0442\u043e\u0431\u044b \u043f\u0440\u043e\u0434\u043e\u043b\u0436\u0438\u0442\u044c.",
        emailTab: "Email",
        phoneTab: "\u0422\u0435\u043b\u0435\u0444\u043e\u043d",
        emailLabel: "Email",
        emailPlaceholder: "you@example.com",
        phoneLabel: "\u041d\u043e\u043c\u0435\u0440 \u0442\u0435\u043b\u0435\u0444\u043e\u043d\u0430",
        phonePlaceholder: "90 123 45 67",
        passwordLabel: "\u041f\u0430\u0440\u043e\u043b\u044c",
        passwordPlaceholder: "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043f\u0430\u0440\u043e\u043b\u044c",
        submit: "\u0412\u043e\u0439\u0442\u0438",
        submitting: "\u0412\u0445\u043e\u0434...",
        helper:
          "\u0424\u043e\u0440\u043c\u0430 \u043e\u0442\u043f\u0440\u0430\u0432\u043b\u044f\u0435\u0442 `emailOrPhone` \u0438 `password`.",
        imageAlt:
          "\u0410\u0431\u0441\u0442\u0440\u0430\u043a\u0442\u043d\u043e\u0435 \u0438\u0437\u043e\u0431\u0440\u0430\u0436\u0435\u043d\u0438\u0435 \u0434\u043b\u044f \u0441\u0442\u0440\u0430\u043d\u0438\u0446\u044b \u0430\u0432\u0442\u043e\u0440\u0438\u0437\u0430\u0446\u0438\u0438.",
        errors: {
          emailRequired:
            "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 email.",
          emailInvalid:
            "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043a\u043e\u0440\u0440\u0435\u043a\u0442\u043d\u044b\u0439 email.",
          phoneRequired:
            "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043d\u043e\u043c\u0435\u0440 \u0442\u0435\u043b\u0435\u0444\u043e\u043d\u0430.",
          phoneInvalid:
            "\u041d\u043e\u043c\u0435\u0440 \u0434\u043e\u043b\u0436\u0435\u043d \u0441\u043e\u0434\u0435\u0440\u0436\u0430\u0442\u044c 9 \u0446\u0438\u0444\u0440 \u0434\u043b\u044f \u0423\u0437\u0431\u0435\u043a\u0438\u0441\u0442\u0430\u043d\u0430.",
          passwordRequired:
            "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043f\u0430\u0440\u043e\u043b\u044c.",
          passwordShort:
            "\u041f\u0430\u0440\u043e\u043b\u044c \u0434\u043e\u043b\u0436\u0435\u043d \u0441\u043e\u0434\u0435\u0440\u0436\u0430\u0442\u044c \u043c\u0438\u043d\u0438\u043c\u0443\u043c 6 \u0441\u0438\u043c\u0432\u043e\u043b\u043e\u0432.",
          loginFailed:
            "\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0432\u043e\u0439\u0442\u0438. \u041f\u0440\u043e\u0432\u0435\u0440\u044c\u0442\u0435 \u0434\u0430\u043d\u043d\u044b\u0435.",
        },
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
      login: {
        brand: "Humayro",
        title: "Hisobga kirish",
        subtitle:
          "Davom etish uchun email yoki telefon raqamingizni kiriting.",
        emailTab: "Email",
        phoneTab: "Telefon",
        emailLabel: "Email",
        emailPlaceholder: "you@example.com",
        phoneLabel: "Telefon raqami",
        phonePlaceholder: "90 123 45 67",
        passwordLabel: "Parol",
        passwordPlaceholder: "Parolni kiriting",
        submit: "Kirish",
        submitting: "Kirilmoqda...",
        helper: "Forma `emailOrPhone` va `password` yuboradi.",
        imageAlt: "Kirish sahifasi uchun dekorativ tasvir.",
        errors: {
          emailRequired: "Email kiriting.",
          emailInvalid: "To'g'ri email kiriting.",
          phoneRequired: "Telefon raqamini kiriting.",
          phoneInvalid:
            "O'zbekiston raqami uchun 9 ta raqam kiriting.",
          passwordRequired: "Parol kiriting.",
          passwordShort: "Parol kamida 6 ta belgidan iborat bo'lsin.",
          loginFailed:
            "Tizimga kirib bo'lmadi. Ma'lumotlarni tekshirib qayta urinib ko'ring.",
        },
      },
    },
  },
} satisfies Record<Language, Record<typeof defaultNamespace, object>>
