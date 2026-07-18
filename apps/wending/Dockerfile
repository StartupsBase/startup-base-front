# syntax=docker/dockerfile:1.7

FROM node:22-bookworm-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm install --global pnpm@10.33.4

FROM base AS dependencies

WORKDIR /workspace

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.json .npmrc ./
COPY apps/wending/package.json apps/wending/package.json
COPY packages/ui/package.json packages/ui/package.json
COPY packages/typescript-config/package.json packages/typescript-config/package.json
COPY packages/eslint-config/package.json packages/eslint-config/package.json

RUN pnpm install --frozen-lockfile --filter wending...

FROM base AS builder

WORKDIR /workspace

COPY --from=dependencies /workspace/node_modules ./node_modules
COPY --from=dependencies /workspace/apps/wending/node_modules ./apps/wending/node_modules
COPY --from=dependencies /workspace/packages/ui/node_modules ./packages/ui/node_modules
COPY --from=dependencies /workspace/packages/eslint-config/node_modules ./packages/eslint-config/node_modules
COPY . .

ARG DEPLOYMENT_VERSION

ENV DEPLOYMENT_VERSION=$DEPLOYMENT_VERSION

RUN pnpm --filter wending build

FROM node:22-bookworm-slim AS runner

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

WORKDIR /app

COPY --from=builder --chown=nextjs:nodejs /workspace/apps/wending/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /workspace/apps/wending/.next/static ./apps/wending/.next/static

USER nextjs
WORKDIR /app

EXPOSE 3000

CMD ["node", "apps/wending/server.js"]
