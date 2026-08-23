import { defineConfig } from "orval"

export default defineConfig({
  humayro: {
    input: {
      target: "./lib/api/openapi.json",
      override: {
        transformer: (schema) => {
          const callback = schema.paths?.["/api/payments/click/callback"]?.post
          if (callback) callback.operationId = "clickCallback"
          return schema
        },
      },
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
