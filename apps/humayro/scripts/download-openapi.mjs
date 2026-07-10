import { mkdir, writeFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"

const source = "https://swagger.humayro.uz/v3/api-docs"
const output = resolve("lib/api/openapi.json")
const response = await fetch(source)

if (!response.ok) {
  throw new Error(`Unable to download OpenAPI document: ${response.status}`)
}

// The API currently exposes a security-scheme key with a space, which is not
// valid OpenAPI and causes strict generators such as Orval to reject the spec.
const specification = (await response.text()).replaceAll(
  '"Bearer Authentication"',
  '"BearerAuthentication"'
)

await mkdir(dirname(output), { recursive: true })
await writeFile(output, specification)
