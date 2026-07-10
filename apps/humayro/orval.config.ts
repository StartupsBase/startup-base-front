import { defineConfig } from "orval"

export default defineConfig({
  humayro: {
    input: {
      target: "./lib/api/openapi.json",
    },
    output: {
      client: "react-query",
      httpClient: "axios",
      mode: "tags-split",
      workspace: "./lib/api",
      target: "./generated",
      schemas: "./model",
      override: {
        mutator: {
          path: "./mutator.ts",
          name: "customInstance",
        },
      },
    },
  },
})
