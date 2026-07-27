import { spawnSync } from "node:child_process"
import process from "node:process"

const environment = process.argv[2]
const scripts = {
  development: "build:development",
  production: "build:production",
}

const buildScript = scripts[environment]

if (!buildScript) {
  console.error(
    "Usage: node scripts/husky/check-humayro.mjs <development|production>"
  )
  process.exit(1)
}

const commands = [
  ["--filter", "humayro", "lint"],
  ["--filter", "humayro", "typecheck"],
  ["--filter", "humayro", "run", buildScript],
]

for (const args of commands) {
  const executable = process.platform === "win32" ? "cmd.exe" : "pnpm"
  const commandArgs =
    process.platform === "win32" ? ["/d", "/s", "/c", "pnpm", ...args] : args
  const result = spawnSync(executable, commandArgs, { stdio: "inherit" })

  if (result.error) {
    console.error(result.error.message)
    process.exit(1)
  }

  if (result.status !== 0) process.exit(result.status ?? 1)
}
