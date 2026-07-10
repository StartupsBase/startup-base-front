import type { AxiosError, AxiosRequestConfig } from "axios"

import { http } from "@/lib/http"

export const customInstance = <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig
): Promise<T> => http({ ...config, ...options }).then(({ data }) => data)

export type ErrorType<TError> = AxiosError<TError>
export type BodyType<TBody> = TBody
