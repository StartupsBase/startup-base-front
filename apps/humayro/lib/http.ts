"use client"

import axios from "axios"
import Cookies from "js-cookie"

import { authTokenCookieName } from "@/lib/auth"

const baseURL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? ""

const http = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
})

http.interceptors.request.use((config) => {
  const token = Cookies.get(authTokenCookieName)

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove(authTokenCookieName)
    }

    return Promise.reject(error)
  }
)

export { http }
