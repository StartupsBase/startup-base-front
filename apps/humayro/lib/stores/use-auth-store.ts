import { create } from "zustand"

import type { UserDTO } from "@/lib/api"

type AuthState = {
  user: UserDTO | null
  setUser: (user: UserDTO | null) => void
  clear: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clear: () => set({ user: null }),
}))
