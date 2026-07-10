"use client"

import Cookies from "js-cookie"

import { authTokenCookieName, authTokenMaxAgeDays } from "@/lib/auth"

export function saveAuthToken(token: string) {
  Cookies.set(authTokenCookieName, token, {
    sameSite: "lax",
    secure: window.location.protocol === "https:",
    expires: authTokenMaxAgeDays,
    path: "/",
  })
}

export function clearAuthToken() {
  Cookies.remove(authTokenCookieName, { path: "/" })
}

export function hasAuthToken() {
  return Boolean(Cookies.get(authTokenCookieName))
}
