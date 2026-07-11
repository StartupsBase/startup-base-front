import { create } from "zustand"
import { devtools } from "zustand/middleware"

import type { UserDTO } from "@/lib/api"

type AuthState = {
  user: UserDTO | null
  identifier: string | null
  setUser: (user: UserDTO | null) => void
  setSession: (user: UserDTO | null, identifier?: string) => void
  clear: () => void
}

export const useAuthStore = create<AuthState>()(
  devtools(
    (set) => ({
      user: null,
      identifier: null,
      setUser: (user) => set({ user }, undefined, "auth/setUser"),
      setSession: (user, identifier) =>
        set(
          { user, identifier: identifier ?? null },
          undefined,
          "auth/setSession"
        ),
      clear: () =>
        set({ user: null, identifier: null }, undefined, "auth/clear"),
    }),
    {
      name: "Humayro",
      store: "auth",
    }
  )
)
