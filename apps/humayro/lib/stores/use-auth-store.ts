import { create } from "zustand"

import type { UserDTO } from "@/lib/api"

type AuthState = {
  user: UserDTO | null
  identifier: string | null
  setUser: (user: UserDTO | null) => void
  setSession: (user: UserDTO | null, identifier?: string) => void
  clear: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  identifier: null,
  setUser: (user) => set({ user }),
  setSession: (user, identifier) => set({ user, identifier: identifier ?? null }),
  clear: () => set({ user: null, identifier: null }),
}))
