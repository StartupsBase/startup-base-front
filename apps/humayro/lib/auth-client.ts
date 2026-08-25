"use client"

import Cookies from "js-cookie"

import {
  authTokenCookieName,
  authTokenMaxAgeDays,
  authTokenStorageName,
} from "@/lib/auth"

export function saveAuthToken(token: string) {
  window.localStorage.setItem(authTokenStorageName, token)
  Cookies.set(authTokenCookieName, token, {
    sameSite: "lax",
    secure: window.location.protocol === "https:",
    expires: authTokenMaxAgeDays,
    path: "/",
  })
}

export function clearAuthToken() {
  window.localStorage.removeItem(authTokenStorageName)
  Cookies.remove(authTokenCookieName, { path: "/" })
}

export function hasAuthToken() {
  return Boolean(Cookies.get(authTokenCookieName))
}
