import type { Language } from "./config"
import ru from "../locales/ru.json"
import uz from "../locales/uz.json"

export const defaultNamespace = "common"

export const resources = {
  ru,
  uz,
} satisfies Record<Language, Record<typeof defaultNamespace, object>>
