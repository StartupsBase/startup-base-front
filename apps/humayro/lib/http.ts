"use client"

import axios from "axios"
import Cookies from "js-cookie"

import { authTokenCookieName } from "@/lib/auth"
import { getApiBaseUrl } from "@/lib/api-url"

const baseURL = getApiBaseUrl()

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
      Cookies.remove(authTokenCookieName, { path: "/" })
    }

    return Promise.reject(error)
  }
)

export { http }
