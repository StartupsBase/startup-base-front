# syntax=docker/dockerfile:1.7

FROM node:22-bookworm-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm install --global pnpm@10.33.4

FROM base AS dependencies

WORKDIR /workspace

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.json .npmrc ./
COPY apps/humayro/package.json apps/humayro/package.json
COPY packages/ui/package.json packages/ui/package.json
COPY packages/typescript-config/package.json packages/typescript-config/package.json
COPY packages/eslint-config/package.json packages/eslint-config/package.json

RUN pnpm install --frozen-lockfile --filter humayro...

FROM base AS builder

WORKDIR /workspace

COPY --from=dependencies /workspace/node_modules ./node_modules
COPY --from=dependencies /workspace/apps/humayro/node_modules ./apps/humayro/node_modules
COPY --from=dependencies /workspace/packages/ui/node_modules ./packages/ui/node_modules
COPY --from=dependencies /workspace/packages/eslint-config/node_modules ./packages/eslint-config/node_modules
COPY . .

ARG NEXT_PUBLIC_API_URL=https://swagger.humayro.uz
ARG NEXT_PUBLIC_YANDEX_MAPS_API_KEY
ARG DEPLOYMENT_VERSION

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_YANDEX_MAPS_API_KEY=$NEXT_PUBLIC_YANDEX_MAPS_API_KEY
ENV DEPLOYMENT_VERSION=$DEPLOYMENT_VERSION

RUN pnpm --filter humayro build

FROM node:22-bookworm-slim AS runner

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

WORKDIR /app

COPY --from=builder --chown=nextjs:nodejs /workspace/apps/humayro/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /workspace/apps/humayro/public ./apps/humayro/public
COPY --from=builder --chown=nextjs:nodejs /workspace/apps/humayro/.next/static ./apps/humayro/.next/static

USER nextjs
WORKDIR /app/apps/humayro

EXPOSE 3000

CMD ["node", "server.js"]
