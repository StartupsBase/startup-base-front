import { spawnSync } from "node:child_process"
import process from "node:process"

const environments = {
  development: {
    apiUrl: "https://dev-api.humayro.uz",
    siteUrl: "https://dev.humayro.uz",
  },
  production: {
    apiUrl: "https://swagger.humayro.uz",
    siteUrl: "https://humayro.uz",
  },
}

const [environmentName, command, ...args] = process.argv.slice(2)
const environment = environments[environmentName]

if (!environment || !command) {
  console.error(
    "Usage: node scripts/run-with-environment.mjs <development|production> <command> [...args]"
  )
  process.exit(1)
}

const apiUrl =
  process.env[
    environmentName === "development"
      ? "HUMAYRO_DEV_API_URL"
      : "HUMAYRO_PRODUCTION_API_URL"
  ]?.trim() || environment.apiUrl
const siteUrl =
  process.env[
    environmentName === "development"
      ? "HUMAYRO_DEV_SITE_URL"
      : "HUMAYRO_PRODUCTION_SITE_URL"
  ]?.trim() || environment.siteUrl
const useCommandPrompt = process.platform === "win32" && command === "pnpm"
const executable = useCommandPrompt ? "cmd.exe" : command
const commandArgs = useCommandPrompt
  ? ["/d", "/s", "/c", "pnpm", ...args]
  : args

const result = spawnSync(executable, commandArgs, {
  env: {
    ...process.env,
    HUMAYRO_DEPLOYMENT: environmentName,
    HUMAYRO_OPENAPI_URL:
      process.env.HUMAYRO_OPENAPI_URL?.trim() || `${apiUrl}/v3/api-docs`,
    NEXT_PUBLIC_API_URL: apiUrl,
    NEXT_PUBLIC_SITE_URL: siteUrl,
  },
  stdio: "inherit",
})

if (result.error) {
  console.error(result.error.message)
  process.exit(1)
}

process.exit(result.status ?? 1)
