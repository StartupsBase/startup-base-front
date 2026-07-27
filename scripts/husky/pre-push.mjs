import { spawnSync } from "node:child_process"
import { readFileSync } from "node:fs"
import process from "node:process"

const zeroSha = /^0+$/
const targets = new Set()
const updates = readFileSync(0, "utf8").trim().split(/\r?\n/).filter(Boolean)

for (const update of updates) {
  const [, localSha, remoteRef] = update.trim().split(/\s+/)

  if (!localSha || zeroSha.test(localSha)) continue
  if (remoteRef === "refs/heads/dev") targets.add("dev")
  if (remoteRef === "refs/heads/main") targets.add("main")
}

if (targets.size === 0) {
  console.log("Husky: no Humayro dev/main branch is being updated; skipping.")
  process.exit(0)
}

for (const target of targets) {
  console.log(`Husky: validating Humayro before pushing ${target}.`)

  const args = ["run", `check:humayro:${target}`]
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
